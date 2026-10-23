import {TYPES,RELATIONS,CLASSES,STATES,PROMPTS,uid,now,initialData,makeDemo,newReflection,safeText,niceDate,normalizeImported,cleanFilename} from './model.js';
import {readApp,writeApp} from './storage.js';
import {markdownFor,promptFor,downloadText,downloadSvgOrPng} from './export.js';
import {GLOSSARY,GLOSSARY_GROUPS,definition} from './glossary.js';
import {suggestThought} from './inference.js';
import {planBulkClassification,summarizeBulkClassification} from './batch.js';
import {neighbours,pathTo,pathRecap,suspectedGaps,branchIdFor,formatDuration} from './journey.js';
import {FALLACIES,FALLACY_STATUSES} from './fallacies.js';
import {metricsFor,reportMarkdown} from './metrics.js';
import {chessPromptFor} from './chess.js';
import {readingStep} from './reading.js';
import {makePresentationHTML} from './presentation.js';
import {analysisPrompt,discussionSummary,parseNextSteps,DISCUSSION_TAGS,END_REASONS} from './analysis.js';
import {APP_VERSION,RELEASES,TOUR_STEPS} from './release.js';

const $=id=>document.getElementById(id);
let app, activeId=null, selectedId=null, view='map', pan={x:100,y:100},zoom=1, visible=new Set(), showMainline=true;
let undo=[],redo=[],saveTimer=null,toastTimer=null,modalCleanup=null,miniExtent=null,edgeFocusId=null;
let journeyNodes=new Set(),journeyEdges=new Set(),journeyTimer=null,tracker=null,trackingTimer=null,navHistory=[];
let readingMode=false,readerOptions=[],readerDirection=null;
let tutorialStep=-1,tutorialOrigin=null,tutorialHighlight=null;
const IDLE_MS=5*60000;
const isMobile=()=>innerWidth<=800;
const reflect=()=>app.reflections.find(r=>r.id===activeId);
const node=id=>reflect()?.nodes.find(n=>n.id===id);
const voice=id=>reflect()?.voices.find(v=>v.id===id);
const labelOf=n=>n.title||n.content.slice(0,55)||TYPES[n.type]?.[0]||'Pensamento';
const clone=o=>JSON.parse(JSON.stringify(o));
const alphabetize=entries=>[...entries].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'pt-BR',{sensitivity:'base',numeric:true}));
const options=(entries,chosen)=>alphabetize(entries).map(([k,v])=>`<option value="${safeText(k)}" ${k===chosen?'selected':''}>${safeText(v)}</option>`).join('');
const typeOptions=chosen=>options(Object.entries(TYPES).map(([id,t])=>[id,t[0]]),chosen);
const relationOptions=chosen=>options(Object.entries(RELATIONS),chosen);
const voiceOptions=chosen=>options(reflect().voices.map(v=>[v.id,v.name]),chosen);
const termHTML=(group,key)=>{const d=definition(group,key);return d?`<b>${safeText(d[0])}</b> — ${safeText(d[1])}<br><span>Ex.: “${safeText(d[2])}”</span>`:'Selecione um termo para ver o significado.';};
function glossaryModal(){openModal('Minidicionário de pensamentos',`<p class="small-note">Toque em um termo para entender quando utilizá-lo. Estas definições não julgam se uma ideia é correta ou verdadeira.</p><input type="search" id="glossarySearch" placeholder="Buscar termo ou significado..." aria-label="Buscar no dicionário" autofocus /><div class="glossary-results" id="glossaryResults"></div>`,el=>{
 const out=el.querySelector('#glossaryResults'),search=el.querySelector('#glossarySearch');
 const paint=()=>{const q=search.value.toLocaleLowerCase('pt-BR').trim();out.innerHTML=GLOSSARY_GROUPS.map(([group,title])=>{
 const entries=Object.entries(GLOSSARY[group]).filter(([id,[label,desc,ex]])=>[label,desc,ex].join(' ').toLocaleLowerCase('pt-BR').includes(q)).sort((a,b)=>a[1][0].localeCompare(b[1][0],'pt-BR',{sensitivity:'base'}));
 return entries.length?`<section class="dictionary-section"><h3>${title}</h3>${entries.map(([id,d])=>`<details class="dictionary-item"><summary>${safeText(d[0])}</summary><p>${safeText(d[1])}</p><small>Exemplo: “${safeText(d[2])}”</small></details>`).join('')}</section>`:'';}).join('')||'<p class="small-note">Nenhum termo encontrado.</p>';};
 search.addEventListener('input',paint);paint();
 });}
function setupInlineTerms(form){function update(name){const el=form.querySelector(`[name="${name}"]`),target=form.querySelector(`[data-definition-for="${name}"]`);if(el&&target)target.innerHTML=termHTML(name==='type'?'types':name==='classification'?'classes':'relations',el.value);}
 for(const name of ['type','classification','relation']){const control=form.querySelector(`[name="${name}"]`);if(control){control.addEventListener('change',()=>update(name));update(name);}}
}


function toast(message,{duration=3100,kind='default'}={}){
 const el=$('toast');el.textContent=message;el.dataset.kind=kind;
 el.classList.add('show');clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{el.classList.remove('show');el.removeAttribute('data-kind');},duration);
}
function batchToast(stats){
 const lead=stats.changed?`✓ ${stats.changed} ${stats.changed===1?'bloco atualizado':'blocos atualizados'}`:'✓ Análise concluída, sem alterações';
 toast(`${lead} · ${stats.unchanged} mantidos · ${stats.total} analisados`,{duration:6500,kind:'success'});
}
function batchSummaryHTML(stats){
 const note=stats.changed
   ?`As sugestões mudaram ${stats.changed} bloco${stats.changed===1?'':'s'} (${stats.changedTypes} tipos e ${stats.changedNatures} naturezas). Os demais mantiveram sua classificação.`
   :'Nenhuma classificação foi modificada. Seus pensamentos permanecem como estavam.';
 return `<section class="batch-summary" aria-label="Resumo da análise de pensamentos">
  <div class="batch-stats">
   <div><strong>${stats.total}</strong><span>Analisados</span></div>
   <div><strong>${stats.changed}</strong><span>Alterados</span></div>
   <div><strong>${stats.unchanged}</strong><span>Mantidos</span></div>
  </div>
  <p class="small-note">${note}</p>
  <p class="batch-breakdown">${stats.alreadyUnchanged} já sem sugestão de mudança · ${stats.notSelected} sugestão${stats.notSelected===1?'':'ões'} não aplicada${stats.notSelected===1?'':'s'}${stats.ignoredBlank?` · ${stats.ignoredBlank} sem conteúdo`:''}${stats.preservedFacts?` · ${stats.preservedFacts} fato${stats.preservedFacts===1?'':'s'} preservado${stats.preservedFacts===1?'':'s'}`:''}.</p>
 </section>`;
}
// Relógio de atenção aproximada: interrompe após 5 minutos sem interação, ao ocultar o app e ao sair.
function refreshClock(){const r=reflect();const m=r?metricsFor(r):null;const e=$('sessionClock');if(e)e.textContent=m?`◷ ${formatDuration(m.totalMs)}`:'00:00';}
function stopTracking(){if(!tracker)return;trackTick();const r=app?.reflections.find(x=>x.id===tracker.id),ss=r?.sessions?.find(x=>x.id===tracker.sessionId);if(ss)ss.endedAt=now();tracker=null;persist();refreshClock();}
function trackTick(){if(!tracker)return;const t=Date.now();const r=app?.reflections.find(x=>x.id===tracker.id);const ss=r?.sessions?.find(x=>x.id===tracker.sessionId);if(!ss){tracker=null;return;}
 const end=Math.min(t,tracker.lastActivity+IDLE_MS),delta=Math.max(0,end-tracker.lastTick);
 if(delta>0&&document.visibilityState==='visible'){
  ss.activeMs=(ss.activeMs||0)+delta;
  if(tracker.focusId){const branch=branchIdFor(r,tracker.focusId);if(branch)ss.focusMs[branch]=(ss.focusMs[branch]||0)+delta;}
 }
 ss.endedAt=new Date(end).toISOString();tracker.lastTick=t;refreshClock();
 if(t>=tracker.lastActivity+IDLE_MS){tracker=null;persist();}
}
function startTracking(){const r=reflect();if(!r||r.status!=='em andamento'||document.visibilityState==='hidden'||tracker)return;
 const ts=now();const ss={id:uid('session'),startedAt:ts,endedAt:ts,activeMs:0,focusMs:{}};
 r.sessions||=[];r.sessions.push(ss);if(r.sessions.length>1000)r.sessions.shift();
 tracker={id:r.id,sessionId:ss.id,lastTick:Date.now(),lastActivity:Date.now(),focusId:selectedId};persist();refreshClock();
}
function activity(){if(!activeId||document.visibilityState==='hidden')return;
 if(!tracker){startTracking();return;}trackTick();if(tracker)tracker.lastActivity=Date.now();
}
function changeTrackedFocus(id){if(tracker){trackTick();if(tracker)tracker.focusId=id;}}
function persist(){if(!app)return;$('saveStatus').textContent='Salvando…';clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{
 try{await writeApp(app);$('saveStatus').textContent='✓ Salvo neste dispositivo';}
 catch(e){console.error(e);$('saveStatus').textContent='Erro ao salvar';toast('Erro no salvamento local. Exporte um backup JSON.');}
},220);}
function checkpoint(){const r=reflect();if(!r)return;undo.push(clone(r));if(undo.length>50)undo.shift();redo=[];}
function pushCheckpoint(old){undo.push(old);if(undo.length>50)undo.shift();redo=[];}
function changed(){const r=reflect();if(r){r.updatedAt=now();persist();renderWorkspace();}else {persist();renderLibrary();}}
function mutation(fn){checkpoint();fn();changed();}
function restoreSnapshot(s){const idx=app.reflections.findIndex(r=>r.id===activeId);if(idx<0)return;app.reflections[idx]=s;if(selectedId&&!node(selectedId))selectedId=null;changed();}
function undoAction(){if(!undo.length)return toast('Nada para desfazer.');redo.push(clone(reflect()));restoreSnapshot(undo.pop());}
function redoAction(){if(!redo.length)return toast('Nada para refazer.');undo.push(clone(reflect()));restoreSnapshot(redo.pop());}

function openModal(title,html,setup,{wide=false}={}){closeModal();$('modalTitle').textContent=title;$('modal').querySelector('.modal-card').classList.toggle('modal-wide',wide);$('modalContent').innerHTML=`<div class="modal-body">${html}</div>`;$('modal').classList.remove('hidden');if(setup)modalCleanup=setup($('modalContent'))||null;
 requestAnimationFrame(()=> $('modalContent').querySelector('[autofocus]')?.focus());}
function closeModal(){modalCleanup?.();modalCleanup=null;$('modal').classList.add('hidden');$('modal').querySelector('.modal-card').classList.remove('modal-wide');$('modalContent').innerHTML='';}
function formModal(title,fields,saveLabel,onSave){openModal(title,`<form id="activeForm">${fields}<div class="modal-actions"><button type="button" class="secondary" data-close-modal>Cancelar</button><button type="submit" class="primary">${saveLabel}</button></div></form>`,el=>{
 const handler=e=>{e.preventDefault();try{if(onSave(new FormData(e.currentTarget))!==false)closeModal();}catch(err){toast(err.message||'Falha ao salvar.');}};el.querySelector('form').addEventListener('submit',handler);return()=>{};});}
const field=(name,label,value='',input='input',required=false,extra='')=>`<div class="field"><label for="f_${name}">${safeText(label)}</label>${input==='textarea'?`<textarea id="f_${name}" name="${name}" ${required?'required':''} ${extra}>${safeText(value)}</textarea>`:`<input id="f_${name}" name="${name}" value="${safeText(value)}" ${required?'required':''} ${extra} />`}</div>`;
const selectField=(name,label,entries,chosen)=>`<div class="field"><label for="f_${name}">${label}</label><select id="f_${name}" name="${name}">${options(entries,chosen)}</select></div>`;

function renderLibrary(){ $('library').classList.remove('hidden');$('workspace').classList.add('hidden');
 const filter=$('libraryFilter').value,q=$('searchReflection').value.trim().toLowerCase();
 const arr=[...app.reflections].filter(r=>(filter==='todas'||(filter==='arquivadas'?r.archived:!r.archived))&&[r.title,r.question,r.description,...r.tags].join(' ').toLowerCase().includes(q)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 $('reflectionCount').textContent=app.reflections.length;
 $('reflectionGrid').innerHTML=arr.length?arr.map(r=>`<article class="reflection-card" data-ref="${safeText(r.id)}"><div class="reflection-card-top"><span class="status-pill ${r.status==='concluído'?'done':r.status==='pausado'?'paused':''}">${safeText(r.archived?'Arquivada':r.status)}</span><div class="card-menu"><button class="icon-btn" data-refmenu="${safeText(r.id)}" aria-label="Opções da reflexão">⋯</button><div class="menu-dropdown hidden" id="menu-${safeText(r.id)}"><button data-libaction="edit">✎ Editar</button><button data-libaction="duplicate">▣ Duplicar</button><button data-libaction="archive">${r.archived?'↩ Desarquivar':'▤ Arquivar'}</button><button data-libaction="delete">✕ Excluir</button></div></div></div><h3>${safeText(r.title)}</h3><p class="question">${safeText(r.question)}</p><div class="tags">${r.tags.slice(0,4).map(t=>`<span class="tag">${safeText(t)}</span>`).join('')||'<span class="tag">Sem etiquetas</span>'}</div><div class="card-footer"><small>${r.nodes.length} blocos · ${niceDate(r.updatedAt)}</small><button data-libaction="open">Continuar →</button></div></article>`).join(''):`<div class="empty-library"><h3>Sem reflexões nesta visualização</h3><p>Crie sua primeira reflexão ou mude o filtro.</p><button class="primary" data-library-create>＋ Nova reflexão</button></div>`;
}
function goHome(){closeReader(false);stopTracking();clearJourneyHighlight();activeId=null;selectedId=null;closeModal();undo=[];redo=[];$('sidebar').classList.remove('collapsed');$('sidebar').classList.toggle('mobile-hidden',isMobile());renderLibrary();}
function openReflection(id){const r=app.reflections.find(r=>r.id===id);if(!r)return;closeReader(false);stopTracking();clearJourneyHighlight();closeModal();activeId=id;selectedId=null;undo=[];redo=[];navHistory=[];view='map';pan={x:50,y:50};zoom=1;
 $('library').classList.add('hidden');$('workspace').classList.remove('hidden');$('sidebar').classList.toggle('mobile-hidden',isMobile());$('sidebar').classList.remove('collapsed');renderWorkspace();requestAnimationFrame(()=>fitMap());startTracking();}
function editReflection(id){const r=id?app.reflections.find(x=>x.id===id):null;
 formModal(r?'Editar reflexão':'Nova reflexão',`${field('title','Título',r?.title||'','input',true,'autofocus maxlength="250"')}${field('question','Pergunta principal',r?.question||'','textarea',true,'maxlength="10000"')}${field('description','Descrição (opcional)',r?.description||'','textarea',false,'maxlength="20000"')}${field('tags','Etiquetas separadas por vírgula',r?.tags.join(', ')||'')}${r?selectField('status','Situação',[['em andamento','Em andamento'],['pausado','Pausado'],['concluído','Concluído']],r.status):''}`,
 r?'Salvar alterações':'Criar reflexão',data=>{const title=data.get('title').trim(),question=data.get('question').trim();if(!title||!question)return toast('Informe título e pergunta principal.'),false;
 const tags=data.get('tags').split(',').map(x=>x.trim()).filter(Boolean).slice(0,20);
 if(r){if(activeId===r.id)checkpoint();r.title=title;r.question=question;r.description=data.get('description').trim();r.tags=tags;r.status=data.get('status');r.updatedAt=now();persist();if(activeId===r.id)renderWorkspace();else renderLibrary();}
 else {const created=newReflection(title,question,data.get('description'),tags);app.reflections.push(created);persist();openReflection(created.id);}return true;});}
function handleLibraryAction(action,id){const r=app.reflections.find(x=>x.id===id);if(!r)return;
 if(action==='open')return openReflection(id);if(action==='edit')return editReflection(id);
 if(action==='duplicate'){const c=clone(r),map=new Map();c.sessions=[];c.completedAt=null;c.id=uid('reflection');c.title=`${r.title} (cópia)`;c.createdAt=now();c.updatedAt=now();c.archived=false;c.nodes.forEach(n=>{const old=n.id;n.id=uid('node');map.set(old,n.id);});c.edges.forEach(e=>{e.id=uid('edge');e.source=map.get(e.source);e.target=map.get(e.target);});app.reflections.push(c);persist();renderLibrary();toast('Reflexão duplicada.');}
 if(action==='archive'){r.archived=!r.archived;r.updatedAt=now();persist();renderLibrary();toast(r.archived?'Reflexão arquivada.':'Reflexão restaurada.');}
 if(action==='delete'){if(!confirm(`Excluir definitivamente “${r.title}” e todos os blocos?\n\nA ação não pode ser desfeita.`))return;app.reflections=app.reflections.filter(x=>x.id!==id);persist();renderLibrary();toast('Reflexão excluída.');}}

function renderWorkspace(){const r=reflect();if(!r)return;
 $('currentTitle').textContent=r.title;$('currentQuestion').textContent=r.question;
 $('resumeSession').classList.toggle('hidden',!r.nodes.some(n=>n.type==='pausa')&&!r.sessions?.length);
 $('finishBtn').classList.toggle('hidden',r.status==='concluído');refreshClock();
 for(const el of document.querySelectorAll('[data-view]'))el.classList.toggle('active',el.dataset.view===view);
 $('mapTab').classList.toggle('active',view==='map');$('historyTab').classList.toggle('active',view==='history');
 $('graphPanel').classList.toggle('hidden',view!=='map');$('historyPanel').classList.toggle('hidden',view!=='history');
 $('undoBtn').disabled=!undo.length;$('redoBtn').disabled=!redo.length;
 $('inspector').classList.toggle('hidden',!selectedId||view!=='map');
 if(view==='map'){renderGraph();renderInspector();}else renderHistory();
}
function changeView(v){if(v==='history'&&readingMode)closeReader(false);view=v;if(v==='history'&&isMobile())$('sidebar').classList.add('mobile-hidden');renderWorkspace();}
function getVisible(){const r=reflect();if(!r)return new Set();const sources=new Map(r.nodes.map(n=>[n.id,[]]));const incoming=new Map(r.nodes.map(n=>[n.id,0]));
 for(const e of r.edges){if(e.relation==='retorna')continue;sources.get(e.source)?.push(e.target);incoming.set(e.target,(incoming.get(e.target)||0)+1);}
 const rootIds=r.nodes.filter(n=>(incoming.get(n.id)||0)===0).map(n=>n.id);
 const first=r.nodes.find(n=>n.type==='pergunta')?.id;if(first&&!rootIds.includes(first))rootIds.unshift(first);
 if(!rootIds.length&&r.nodes.length)rootIds.push(r.nodes[0].id);
 const vis=new Set(),queue=[...rootIds];while(queue.length){const id=queue.shift();if(vis.has(id))continue;vis.add(id);if(node(id)?.collapsed)continue;for(const to of sources.get(id)||[])if(!vis.has(to))queue.push(to);}
 return vis;
}
const nodeHeights=new Map();
function nodeMetrics(id){const n=node(id);if(!n)return {h:170};return {h:nodeHeights.get(id)||190};}
function renderGraph(){const r=reflect();if(!r)return;visible=getVisible();$('graphEmpty').classList.toggle('hidden',!!r.nodes.length);
 $('graphNodes').innerHTML=r.nodes.filter(n=>visible.has(n.id)).map(n=>{const t=TYPES[n.type]||TYPES.premissa,v=voice(n.voiceId),childCount=r.edges.filter(e=>e.source===n.id&&e.relation!=='retorna').length;
 return `<div class="thought-node ${selectedId===n.id?'selected':''} ${journeyNodes.size?(journeyNodes.has(n.id)?'journey-lit':'journey-muted'):''} ${n.state==='abandonado'?'inactive':''}" data-node="${safeText(n.id)}" style="left:${n.x}px;top:${n.y}px;--node-color:${t[2]}"><div class="node-inner"><div class="node-label"><span>${safeText(t[1])} ${safeText(t[0])}</span>${childCount?`<span class="collapse-indicator" title="Clique duas vezes no indicador para recolher ou expandir">${n.collapsed?'▸':'▾'} ${childCount}</span>`:''}</div><div class="node-title">${safeText(n.title||t[0])}</div><div class="node-content">${safeText(n.content)}</div><div class="node-footer"><span class="voice-chip"><i class="voice-dot" style="--voice-color:${safeText(v?.color||'#90a6c1')}"></i>${safeText(v?.name||'Sem voz')}</span><span>${n.annotations?.length?`◫ ${n.annotations.length} · `:''}${n.fallacies?.length?`⚑ ${n.fallacies.length} · `:''}${safeText(STATES[n.state]||'Ativo')}</span></div></div></div>`;
 }).join('');
 for(const el of $('graphNodes').children)nodeHeights.set(el.dataset.node,el.offsetHeight);
 renderEdges();updateTransform();drawMini();$('selectionHint').textContent=selectedId?'Use ← e → ou abra o modo leitura para seguir as conexões.':'Escolha um pensamento para continuar seu raciocínio.';updateNavigator();
}
function edgeGeometry(a,b){let x1=a.x+280,y1=a.y+nodeMetrics(a.id).h/2,x2=b.x,y2=b.y+nodeMetrics(b.id).h/2;
 if(x2>=x1-15){const d=Math.max(65,Math.abs(x2-x1)*.48);return {d:`M${x1} ${y1} C${x1+d} ${y1} ${x2-d} ${y2} ${x2} ${y2}`,mx:(x1+x2)/2,my:(y1+y2)/2-9};}
 x1=a.x+140;y1=a.y+nodeMetrics(a.id).h;x2=b.x+140;y2=b.y;
 return {d:`M${x1} ${y1} C${x1+72} ${y1+95} ${x2-72} ${y2-95} ${x2} ${y2}`,mx:(x1+x2)/2,my:(y1+y2)/2-5};
}
function renderEdges(){const r=reflect();if(!r)return;
 $('graphEdges').innerHTML=`<defs><marker id="edgeArrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L11 6L1 11Z" fill="#8a9fc1"/></marker></defs>`+r.edges.filter(e=>visible.has(e.source)&&visible.has(e.target)).map(e=>{
 const a=node(e.source),b=node(e.target);if(!a||!b)return '';const g=edgeGeometry(a,b),main=showMainline&&['continua','reformula','retorna'].includes(e.relation),label=RELATIONS[e.relation]||e.relation;const journey=journeyEdges.has(e.id);
 return `<g><path class="edge-visible ${journey?'journey-edge':''} ${journeyEdges.size&&!journey?'journey-edge-muted':''} ${main?'mainline':''} ${e.relation==='contesta'?'contest':''}" d="${g.d}"/><path class="edge-hit" d="${g.d}" data-edge="${safeText(e.id)}"/><text class="edge-label" text-anchor="middle" x="${g.mx}" y="${g.my}">${safeText(label)}</text></g>`;}).join('');
}
function updateTransform(){ $('graphStage').style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;$('zoomLabel').textContent=`${Math.round(zoom*100)}%`;}
function canvasSize(){return {width:$('graphViewport').clientWidth,height:$('graphViewport').clientHeight};}
function fitMap(){const r=reflect();if(!r||view!=='map')return;const nodes=r.nodes.filter(n=>visible.has(n.id));if(!nodes.length)return;
 const left=Math.min(...nodes.map(n=>n.x))-65,right=Math.max(...nodes.map(n=>n.x+280))+65,top=Math.min(...nodes.map(n=>n.y))-60,bottom=Math.max(...nodes.map(n=>n.y+nodeMetrics(n.id).h))+60;
 const {width,height}=canvasSize();if(!width||!height)return;zoom=Math.min(1.12,Math.max(.22,Math.min(width/(right-left),height/(bottom-top))));pan={x:(width-(left+right)*zoom)/2,y:(height-(top+bottom)*zoom)/2};updateTransform();drawMini();}
function focusNode(id){const n=node(id);if(!n)return;changeTrackedFocus(id);changeView('map');if(!visible.has(id)){for(const other of reflect().nodes)other.collapsed=false;renderGraph();}
 selectedId=id;const {width,height}=canvasSize();pan={x:width/2-(n.x+140)*zoom,y:height/2-(n.y+nodeMetrics(id).h/2)*zoom};renderWorkspace();if(isMobile())$('inspector').classList.add('hidden');updateTransform();drawMini();}
function setZoom(z,cx,cy){const {width,height}=canvasSize();cx??=width/2;cy??=height/2;const currentX=(cx-pan.x)/zoom,currentY=(cy-pan.y)/zoom;zoom=Math.min(2.5,Math.max(.2,z));pan.x=cx-currentX*zoom;pan.y=cy-currentY*zoom;updateTransform();drawMini();}
function drawMini(){const r=reflect();if(!r||!r.nodes.length)return;const nodes=r.nodes.filter(n=>visible.has(n.id));if(!nodes.length)return;
 const left=Math.min(...nodes.map(n=>n.x))-140,top=Math.min(...nodes.map(n=>n.y))-120,right=Math.max(...nodes.map(n=>n.x+280))+140,bottom=Math.max(...nodes.map(n=>n.y+nodeMetrics(n.id).h))+120;
 miniExtent={left,top,right,bottom};const width=right-left,height=bottom-top;const X=x=>((x-left)/width*200),Y=y=>((y-top)/height*100);
 const {width:vw,height:vh}=canvasSize();const visleft=(0-pan.x)/zoom,vistop=(0-pan.y)/zoom,visright=(vw-pan.x)/zoom,visbottom=(vh-pan.y)/zoom;
 $('miniMapSvg').innerHTML=nodes.map(n=>`<rect x="${X(n.x)}" y="${Y(n.y)}" width="${Math.max(3,280/width*200)}" height="${Math.max(2,nodeMetrics(n.id).h/height*100)}" rx="2" fill="${TYPES[n.type]?.[2]||'#8a9fc1'}" opacity=".8"/>`).join('')+`<rect x="${X(visleft)}" y="${Y(vistop)}" width="${(visright-visleft)/width*200}" height="${(visbottom-vistop)/height*100}" stroke="#fff" stroke-width="1.6" fill="#9bb6ff18"/>`;
}
function selectNode(id){changeTrackedFocus(id);selectedId=id;for(const el of $('graphNodes').children)el.classList.toggle('selected',el.dataset.node===id);renderInspector();$('inspector').classList.toggle('hidden',!selectedId||view!=='map');updateNavigator();}
function renderInspector(){const r=reflect(),n=node(selectedId);if(!r||!n)return;
 const t=TYPES[n.type]||TYPES.comentario,v=voice(n.voiceId),incomings=r.edges.filter(e=>e.target===n.id),outgoings=r.edges.filter(e=>e.source===n.id),notes=n.annotations||[];
 $('inspectorContent').innerHTML=`<div class="inspector-body"><div class="info-line" style="color:${t[2]}">${safeText(t[1])} ${safeText(t[0])} <button class="inline-help" data-inspector="dictionary">? significado</button></div><h2>${safeText(n.title||t[0])}</h2><div class="content-paragraph">${safeText(n.content)}</div>${n.notes?`<p class="small-note"><b>Contexto:</b> ${safeText(n.notes)}</p>`:''}<div class="inline-metas"><span class="tag">${safeText(v?.name||'Sem voz')}</span><span class="tag">${safeText(CLASSES[n.classification]||'Não classificado')}</span><span class="tag">${safeText(STATES[n.state]||'Ativo')}</span></div>
 <div class="inspector-footer"><button type="button" class="primary small" data-inspector="read">▣ Ler ampliado</button><button class="secondary small" data-inspector="edit">✎ Editar bloco</button><button class="secondary small" data-inspector="connect">⤳ Conectar</button><button class="secondary small" data-inspector="collapse">${n.collapsed?'▸ Expandir':'▾ Recolher'}</button></div>
 ${n.type==='pausa'?`<div class="resume-hint"><b>Ponto de retomada</b><p>Este bloco registra onde a conversa parou.</p><button class="secondary small" data-inspector="resumeFrom">↗ Retomar com resumo</button></div>`:''}
 <p class="small-note">Criado: ${safeText(niceDate(n.createdAt))} · Editado: ${safeText(niceDate(n.updatedAt))}</p>
 <div class="section-title">★ PONTOS PARA CONVERSAR (${(n.discussion||[]).length})</div><p class="small-note">Marque trechos que deseja discutir na sessão. Nenhum destaque é enviado automaticamente.</p>
 <div class="discussion-list">${(n.discussion||[]).map(d=>`<div class="discussion-row"><button type="button" class="secondary small" data-remove-discussion="${safeText(d.id)}">Remover</button><b>${safeText(DISCUSSION_TAGS[d.key]||d.label||d.key)}</b>${d.note?`<small>${safeText(d.note)}</small>`:''}</div>`).join('')||'<p class="small-note">Nenhum marcador ainda.</p>'}</div><button class="secondary small" data-inspector="discussion">★ Marcar para conversar</button>
 <div class="section-title">POSSÍVEIS FALÁCIAS (${(n.fallacies||[]).length})</div>
 <p class="small-note">Marcadas por você, não verificadas automaticamente. Um rótulo não prova um erro.</p>
 <div class="fallacy-list">${(n.fallacies||[]).map(f=>`<div class="fallacy-row"><b>⚑ ${safeText(FALLACIES[f.key]?.[0]||f.key)}</b><small>${safeText(FALLACY_STATUSES[f.status]||f.status)}</small><p>${safeText(f.note)}</p><button type="button" class="secondary small" data-edit-fallacy="${safeText(f.id)}">Revisar</button></div>`).join('')||'<span class="small-note">Nenhuma falácia marcada.</span>'}</div>
 <button class="secondary small" data-inspector="addFallacy">⚑ Marcar possível falácia</button>
 <div class="section-title">CONTINUAR A PARTIR DAQUI</div><div class="action-grid">
 ${[['continue','↗ Continuar'],['question','? Perguntar'],['object','! Objetar'],['respond','↩ Responder'],['example','▦ Exemplo'],['scenario','◇ Cenário'],['emotion','♡ Emoção'],['conclude','◉ Concluir'],['branch','⑂ Ramificação'],['return','↶ Retornar'],['comment','☷ Comentar'],['pause','⏸ Pausar'],['agree','≈ Concordar'],['meta','↹ Sobre o debate'],['plan','☰ Organizar']].sort((a,b)=>a[1].replace(/^[^\p{L}]+/u,'').localeCompare(b[1].replace(/^[^\p{L}]+/u,''),'pt-BR',{sensitivity:'base'})).map(([a,l])=>`<button data-quick="${a}">${l}</button>`).join('')}</div>
 <div class="section-title">NOTAS LATERAIS (${notes.length})</div><p class="small-note">Notas são anexadas a este bloco sem virar novos nós nem conexões.</p>
 <div class="margin-notes">${notes.map(a=>`<div class="margin-note"><div>${safeText(a.text)}</div><small>${niceDate(a.createdAt)}</small><button class="icon-btn" data-remove-note="${safeText(a.id)}" title="Excluir esta nota" aria-label="Excluir nota">×</button></div>`).join('')||'<div class="small-note">Nenhuma nota adicionada.</div>'}</div><button class="secondary small" data-inspector="addNote">＋ Adicionar nota lateral</button>
 <div class="section-title">CONEXÕES (${incomings.length} entrada(s), ${outgoings.length} saída(s))</div><div class="small-note">${outgoings.map(e=>`<div style="margin-bottom:8px">${safeText(RELATIONS[e.relation])} → ${safeText(labelOf(node(e.target)||{title:'Bloco ausente'}))}</div>`).join('')||'Nenhuma conexão de saída.'}</div>
 <div class="inspector-footer"><button class="secondary small" data-inspector="challenge">✦ Desafiar pensamento</button><button class="secondary small danger-outline" data-inspector="delete">✕ Excluir</button></div></div>`;
}
function markFallacy(existingId=null){const n=node(selectedId);if(!n)return;const old=n.fallacies?.find(f=>f.id===existingId);
 const choices=Object.entries(FALLACIES).map(([key,v])=>[key,v[0]]);
 openModal(old?'Revisar possível falácia':'Marcar possível falácia',`<p class="small-note">Isto registra uma <b>suspeita sua</b>; não confirma que houve uma falácia. No prompt de IA, a marcação será examinada criticamente.</p><form id="fallacyForm">${selectField('key','Possível falácia',choices,old?.key||'espantalho')}<div id="fallacyMeaning" class="term-definition"></div>${selectField('status','Situação da marcação',Object.entries(FALLACY_STATUSES),old?.status||'suspeita')}${field('note','Por que você suspeita disso? (opcional)',old?.note||'','textarea',false,'maxlength="4000" rows="3"')}<div class="modal-actions">${old?'<button type="button" class="secondary danger-outline" id="removeFallacy">Remover</button>':'<button type="button" class="secondary" data-close-modal>Cancelar</button>'}<button type="submit" class="primary">Salvar marcação</button></div></form>`,el=>{
 const form=el.querySelector('#fallacyForm'),select=form.elements.key,meaning=el.querySelector('#fallacyMeaning');const explain=()=>meaning.textContent=FALLACIES[select.value]?.[1]||'';select.addEventListener('change',explain);explain();
 form.onsubmit=e=>{e.preventDefault();const d=new FormData(form);mutation(()=>{n.fallacies||=[];if(old){old.key=d.get('key');old.status=d.get('status');old.note=String(d.get('note')||'').trim();}else n.fallacies.push({id:uid('fallacy'),key:d.get('key'),status:d.get('status'),note:String(d.get('note')||'').trim(),createdAt:now()});n.updatedAt=now();});closeModal();toast('Marcação registrada para revisão posterior.');};
 if(old)el.querySelector('#removeFallacy').onclick=()=>{mutation(()=>{n.fallacies=n.fallacies.filter(x=>x.id!==old.id);});closeModal();toast('Marcação removida.');};
 });
}
function updateNavigator(){const r=reflect();if(!r)return;const a=$('navigateBack'),b=$('navigateForward'),label=$('navigationLabel');
 if(!a||!b)return;const previous=selectedId?neighbours(r,selectedId,'back'):[],next=selectedId?neighbours(r,selectedId,'next'):[];
 a.disabled=!previous.length;b.disabled=!next.length;label.textContent=selectedId?`${previous.length} anterior(es) · ${next.length} próximo(s)`:'Selecione um bloco';
}
function showReader(id=selectedId){
 const r=reflect();if(!r||!r.nodes.length)return toast('Crie um pensamento para iniciar a leitura.');
 const initial=id&&node(id)?id:r.nodes.find(n=>n.title==='Pergunta principal')?.id||r.nodes[0].id;
 closeModal();readingMode=true;readerOptions=[];readerDirection=null;
 $('readerOverlay').classList.remove('hidden');
 // O leitor é independente do canvas e nunca recebe eventos de arraste.
 focusNode(initial);renderReader();$('readerOverlay').focus({preventScroll:true});
}
function closeReader(returnToMap=true){
 if(!readingMode)return;readingMode=false;readerOptions=[];readerDirection=null;
 $('readerOverlay').classList.add('hidden');$('readerChoices').classList.add('hidden');
 if(returnToMap&&reflect()){
  if(selectedId)focusNode(selectedId);
  $('graphViewport').focus({preventScroll:true});
 }
}
function renderReader(){
 if(!readingMode)return;
 const r=reflect(),n=node(selectedId);if(!r||!n){closeReader(false);return;}
 const t=TYPES[n.type]||TYPES.comentario,v=voice(n.voiceId);
 const prev=neighbours(r,n.id,'back'),next=neighbours(r,n.id,'next');
 $('readerDebateTitle').textContent=r.title;
 $('readerCard').style.setProperty('--reader-color',t[2]);
 $('readerCard').innerHTML=`<div class="reader-meta"><span class="reader-type">${safeText(t[1])} ${safeText(t[0])}</span><span class="reader-voice">● ${safeText(v?.name||'Sem voz')}</span></div>
  <h2>${safeText(n.title||t[0])}</h2>
  <div class="reader-text">${safeText(n.content||'Este bloco não possui conteúdo.')}</div>
  ${n.notes?`<div class="reader-note"><b>Contexto</b><p>${safeText(n.notes)}</p></div>`:''}
  ${(n.annotations||[]).length?`<div class="reader-note"><b>Notas laterais</b>${n.annotations.map(a=>`<p>${safeText(a.text)}</p>`).join('')}</div>`:''}
  ${(n.discussion||[]).length?`<div class="reader-note"><b>★ Para conversar</b>${n.discussion.map(d=>`<p>${safeText(DISCUSSION_TAGS[d.key]||d.label||d.key)}${d.note?': '+safeText(d.note):''}</p>`).join('')}</div>`:''}
  <div class="reader-meta-footer"><span>${safeText(CLASSES[n.classification]||'Não classificado')}</span><span>${safeText(niceDate(n.createdAt))}</span>${n.fallacies?.length?`<span>⚑ ${n.fallacies.length} possível(is) falácia(s) anotada(s)</span>`:''}</div>`;
 $('readerBack').disabled=!prev.length;
 $('readerNext').disabled=!next.length;
 $('readerPosition').textContent=`${prev.length} entrada(s) · ${next.length} saída(s)`;
 const panel=$('readerChoices');
 if(readerOptions.length){
  panel.classList.remove('hidden');
  panel.innerHTML=`<h3>${readerDirection==='next'?'Qual caminho seguir?':'De qual bloco voltar?'}</h3><p>Escolha uma ligação. Nenhuma ramificação será alterada.</p><div class="reader-routes">${readerOptions.map((c,i)=>`<button type="button" class="reader-route" data-reader-route="${i}"><span class="reader-route-number">${i+1}</span><span><b>${safeText(labelOf(c.node))}</b><small>${safeText(RELATIONS[c.edge.relation]||c.edge.relation)} · ${safeText(TYPES[c.node.type]?.[0]||'Pensamento')}</small></span><span>→</span></button>`).join('')}</div>`;
 }else{panel.classList.add('hidden');panel.innerHTML='';}
}
function readFollow(candidate,direction,fromHistory=false){
 if(direction==='next')navHistory.push({from:selectedId,to:candidate.node.id});
 else if(fromHistory)navHistory.pop();
 else navHistory=[];
 readerOptions=[];readerDirection=null;
 focusNode(candidate.node.id);renderReader();
 $('readerCenter').scrollTop=0;
 $('readerOverlay').focus({preventScroll:true});
}
function readerMove(direction){
 const r=reflect();if(!r||!readingMode)return;
 const action=readingStep(r,selectedId,direction,navHistory);
 if(action.kind==='missing'||action.kind==='end'){
  readerOptions=[];readerDirection=null;renderReader();
  toast(direction==='back'?'Não existe um bloco anterior.':'Fim deste caminho. Você pode voltar ou retornar ao mapa.');return;
 }
 if(action.kind==='single'){readFollow(action.candidate,direction,action.fromHistory);return;}
 readerOptions=action.candidates;readerDirection=direction;renderReader();
 $('readerChoices').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function readerChoose(index){if(!readingMode||!readerOptions[index])return;readFollow(readerOptions[index],readerDirection);}
function navigate(direction){if(readingMode)return readerMove(direction);const r=reflect();if(!r||view!=='map')return;if(!selectedId){const id=r.nodes.find(n=>n.title==='Pergunta principal')?.id||r.nodes[0]?.id;if(id)focusNode(id);return;}
 const candidates=neighbours(r,selectedId,direction==='back'?'back':'next');if(!candidates.length){toast(direction==='back'?'Sem ligação anterior.':'Este caminho não possui próxima ligação.');return;}
 const remembered=direction==='back'&&navHistory.length&&navHistory.at(-1).to===selectedId?navHistory.at(-1):null;
 if(remembered&&candidates.some(c=>c.node.id===remembered.from)){navHistory.pop();focusNode(remembered.from);return;}
 const follow=entry=>{if(direction==='next')navHistory.push({from:selectedId,to:entry.node.id});else navHistory=[];focusNode(entry.node.id);};
 if(candidates.length===1){follow(candidates[0]);return;}
 const title=direction==='next'?'Qual ramificação seguir?':'De qual pensamento voltar?';
 openModal(title,`<p class="small-note">Há ${candidates.length} conexões. Escolha o caminho correto; nenhuma ligação será apagada.</p><div class="route-choices">${candidates.map((c,i)=>`<button type="button" class="route-choice" data-route-index="${i}"><b>${i+1}. ${safeText(labelOf(c.node))}</b><small>${safeText(RELATIONS[c.edge.relation]||c.edge.relation)} · ${safeText(TYPES[c.node.type]?.[0])}</small></button>`).join('')}</div>`,el=>el.querySelectorAll('[data-route-index]').forEach(btn=>btn.onclick=()=>{const entry=candidates[Number(btn.dataset.routeIndex)];closeModal();follow(entry);}),{wide:false});
}
function showGapSuggestions(){const r=reflect();if(!r)return;const gaps=suspectedGaps(r);
 if(!gaps.length){openModal('Pausas possíveis',`<p>Não encontrei conexões diretas com intervalo de pelo menos <b>1 hora</b> entre as criações dos blocos.</p><p class="small-note">Isso não significa que não houve pausas; a análise não observa atividades fora do app.</p><div class="modal-actions"><button class="primary" data-close-modal>Entendi</button></div>`);return;}
 const content=gaps.map(g=>`<div class="gap-row"><b>${safeText(labelOf(g.source))}</b> → <b>${safeText(labelOf(g.target))}</b><p class="small-note">Intervalo: ${formatDuration(g.gap)} · ${safeText(niceDate(g.source.createdAt))} até ${safeText(niceDate(g.target.createdAt))}</p><button class="secondary small" data-insert-gap="${safeText(g.edgeId)}">Inserir marcador neste caminho</button></div>`).join('');
 openModal('Possíveis pausas não registradas',`<p class="small-note">Encontrei ${gaps.length} conexão(ões) separadas por ≥ 1h. <b>Intervalo entre criações não comprova pausa.</b> Só será inserido um marcador mediante confirmação.</p><div class="batch-list">${content}</div><div class="modal-actions"><button class="primary" data-close-modal>Fechar</button></div>`,el=>el.querySelectorAll('[data-insert-gap]').forEach(btn=>btn.onclick=()=>{
 const edgeId=btn.dataset.insertGap,g=gaps.find(item=>item.edgeId===edgeId);if(!g||!reflect().edges.some(e=>e.id===edgeId))return toast('A conexão não está mais disponível.');
 if(!confirm(`Inserir marcador de pausa POSSÍVEL entre esses dois blocos? O link existente será dividido em dois links; você poderá desfazer.`))return;
 const ts=now();let pauseId;mutation(()=>{const r=reflect(),edge=r.edges.find(e=>e.id===edgeId);if(!edge)return;pauseId=uid('node');const x=(g.source.x+g.target.x)/2,y=(g.source.y+g.target.y)/2+160;
 r.nodes.push({id:pauseId,type:'pausa',title:'Possível pausa não registrada',content:`Intervalo de ${formatDuration(g.gap)} entre criações. Este marcador foi inserido depois e não confirma uma interrupção.`,notes:'Adicionado manualmente após sugestão baseada em datas.',classification:'',state:'ativo',voiceId:r.voices.find(v=>v.id==='observador')?.id||r.voices[0].id,x,y,annotations:[],fallacies:[],collapsed:false,createdAt:ts,updatedAt:ts,suggestedGap:{from:g.source.createdAt,to:g.target.createdAt,durationMs:g.gap}});
 r.edges=r.edges.filter(e=>e.id!==edgeId);r.edges.push({id:uid('edge'),source:g.source.id,target:pauseId,relation:'continua',createdAt:ts},{id:uid('edge'),source:pauseId,target:g.target.id,relation:edge.relation,createdAt:ts});
 });closeModal();focusNode(pauseId);toast('Marcador de pausa possível inserido. Use Ctrl+Z para desfazer.');
 }),{wide:true});
}
function showReport(){const r=reflect();if(!r)return;trackTick();const m=metricsFor(r);
 const list=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([a,b])=>`<div class="stat-line"><span>${safeText(a)}</span><b>${b}</b></div>`).join('')||'<span class="small-note">Nenhum registro.</span>';
 openModal('◎ Relatório do debate',`<div class="report-head"><span class="status-pill">${m.isComplete?'Concluído':'Em andamento — parcial'}</span><p>${safeText(r.question)}</p><p class="small-note">Primeiro bloco: ${safeText(niceDate(m.firstAt))} · ${m.isComplete?'Concluído':'Último marco'}: ${safeText(niceDate(m.lastAt))}</p></div><div class="report-kpis"><div><strong>${m.totalNodes}</strong><span>Blocos</span></div><div><strong>${m.totalEdges}</strong><span>Conexões</span></div><div><strong>${m.sessionCount}</strong><span>Sessões</span></div><div><strong>${m.allFallacies.length}</strong><span>Marcações</span></div></div>
 <div class="report-time"><b>◷ Tempo ativo estimado: ${formatDuration(m.totalMs)}</b><p>Intervalo de calendário: ${formatDuration(m.calendarMs)} (inclui períodos fora do aplicativo).</p><p class="small-note">A contagem ativa para quando o app fica oculto ou após 5 minutos sem interação. Não mede seus pensamentos fora da tela nem determina quanto você levou para formular cada argumento.</p></div>
 <div class="report-columns"><section><h3>Tipos de pensamento</h3>${list(m.byType)}</section><section><h3>Vozes</h3>${list(m.byVoice)}</section><section><h3>Relações</h3>${list(m.byRelation)}</section><section><h3>Marcações de falácias</h3>${list(m.fallaciesByStatus)}</section></div>
 <h3>Registro de sessões</h3><div class="session-ledger">${(r.sessions||[]).slice(-25).map((ss,i)=>`<div class="stat-line"><span>Sessão ${(r.sessions||[]).length-Math.min(25,(r.sessions||[]).length)+i+1} · ${safeText(niceDate(ss.startedAt))} → ${safeText(niceDate(ss.endedAt))}</span><b>${formatDuration(ss.activeMs)}</b></div>`).join('')||'<p class="small-note">Nenhuma sessão registrada nesta versão.</p>'}</div><p class="small-note">Até 25 sessões mais recentes nesta visualização; o relatório exportado inclui todas as sessões preservadas.</p>
 <h3>Encerramento mais recente</h3><p>${safeText(r.closure?`${END_REASONS[r.closure.kind]||r.closure.kind} · ${niceDate(r.closure.at)}${r.closure.note?' — '+r.closure.note:''}`:'Nenhum motivo de encerramento registrado.')}</p>
 <h3>Pausas registradas</h3><div class="session-ledger">${r.nodes.filter(n=>n.type==='pausa').sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))).slice(-20).map(n=>`<div class="stat-line"><span>${safeText(n.title||'Pausa')} · ${safeText(niceDate(n.createdAt))}</span><b>${n.suggestedGap?'Sugerida':'Registrada'}</b></div>`).join('')||'<span class="small-note">Nenhuma pausa marcada.</span>'}</div>
 <h3>Tempo por cenário (estimativa de atenção)</h3><p class="small-note">Distribuído pelo cenário associado ao bloco selecionado enquanto o app estava ativo; não mede todo o tempo gasto pensando em cada cenário e não garante exclusividade entre caminhos.</p>
 <div class="report-scenarios">${m.branches.map(b=>`<div class="stat-line"><span>${safeText(b.title)}</span><b>${formatDuration(b.activeMs)}</b></div>`).join('')||'<span class="small-note">Sem ramificações.</span>'}<div class="stat-line"><span>Sem cenário identificado</span><b>${formatDuration(m.unassignedMs)}</b></div></div>
 <div class="modal-actions"><button type="button" class="secondary" id="saveReportMd">↓ Baixar relatório</button><button type="button" class="secondary" id="copyChessReport">♟ Copiar prompt de xadrez</button><button type="button" class="primary" data-close-modal>Fechar</button></div>`,el=>{
 el.querySelector('#saveReportMd').onclick=()=>downloadText(`${cleanFilename(r.title)}-relatorio.md`,reportMarkdown(r),'text/markdown;charset=utf-8');
 el.querySelector('#copyChessReport').onclick=()=>navigator.clipboard.writeText(chessPromptFor(r)).then(()=>toast('Prompt de xadrez copiado.')).catch(()=>{toast('Não foi possível acessar a área de transferência. Use Exportar → Prompt de xadrez.');});
 },{wide:true});
}
function finishReflection(){const r=reflect();if(!r)return;
 openModal('Encerrar a sessão de reflexão',`<p class="small-note">Nem todo encerramento significa uma resposta definitiva. Registre o motivo sem apagar o histórico.</p><form id="closureForm">${selectField('reason','Como você terminou este debate?',Object.entries(END_REASONS),'provisoria')}${field('note','O que ficou pendente ou o que você concluiu? (opcional)','', 'textarea',false,'maxlength="5000" rows="4"')}<div class="modal-actions"><button class="secondary" data-close-modal type="button">Cancelar</button><button class="primary" type="submit">Registrar e ver relatório</button></div></form>`,el=>{
 el.querySelector('#closureForm').onsubmit=e=>{e.preventDefault();const form=new FormData(e.currentTarget),kind=form.get('reason');if(!END_REASONS[kind])return;stopTracking();mutation(()=>{
  const closure={kind,note:String(form.get('note')||'').trim(),at:now()};r.closure=closure;r.closures||=[];r.closures.push(closure);r.status=kind==='pausa'?'pausado':'concluído';r.completedAt=kind==='pausa'?null:closure.at;
 });closeModal();showReport();toast(kind==='pausa'?'Pausa registrada.':'Encerramento registrado com motivo.');};
 });
}
function copyChessPrompt(){const r=reflect();if(!r)return;const text=chessPromptFor(r);openModal('♟ Prompt de xadrez',`<p class="small-note">Metáfora narrativa; não é uma partida real nem valida automaticamente os argumentos. Copie manualmente para uma IA de sua escolha.</p><textarea id="chessText" rows="12" readonly>${safeText(text)}</textarea><div class="modal-actions"><button class="secondary" id="downloadChessText">↓ Salvar .txt</button><button class="primary" id="copyChessText">Copiar prompt</button></div>`,el=>{
 el.querySelector('#copyChessText').onclick=()=>navigator.clipboard.writeText(text).then(()=>toast('Prompt de xadrez copiado.')).catch(()=>{el.querySelector('#chessText').select();toast('Selecione e copie o texto manualmente.');});
 el.querySelector('#downloadChessText').onclick=()=>downloadText(`${cleanFilename(r.title)}-xadrez.txt`,text);
 },{wide:true});}
function addMarginNote(){const n=node(selectedId);if(!n)return;
 formModal('Nota lateral',`<p class="small-note">Uma observação associada ao bloco, sem alterar o mapa.</p>${field('text','Anotação','', 'textarea',true,'autofocus maxlength="6000" rows="4"')}`,'Anexar nota',data=>{
 const text=String(data.get('text')||'').trim();if(!text)return false;
 if((n.annotations||[]).length>=100){toast('Limite de 100 notas por bloco.');return false;}
 mutation(()=>{n.annotations||=[];n.annotations.push({id:uid('note'),text,createdAt:now()});n.updatedAt=now();});return true;});}
function removeMarginNote(id){const n=node(selectedId);if(!n||!n.annotations?.some(a=>a.id===id))return;
 if(!confirm('Excluir esta nota lateral? Você pode desfazer a ação.'))return;
 mutation(()=>{n.annotations=n.annotations.filter(a=>a.id!==id);n.updatedAt=now();});toast('Nota removida.');}
function pauseReflection(){const r=reflect();if(!r)return;
 openNodeEditor(null,{type:'pausa',parentId:selectedId||undefined,voiceId:r.voices.find(v=>v.id==='observador')?.id||r.voices[0].id,markPaused:true,content:'Parei aqui. Ao voltar, preciso retomar: '});}
function resumeReflection(fromId=null){const r=reflect();if(!r)return;
 const marker=fromId?node(fromId):[...r.nodes].filter(n=>n.type==='pausa').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
 const target=marker||[...r.nodes].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
 if(!target){toast('Crie um pensamento para começar.');return;}
 const rec=pathRecap(r,target.id),last=r.sessions?.at(-1),lastAt=last?.endedAt||target.createdAt;
 const lines=rec.lines.map((line,i)=>`<div class="recap-line"><b>${safeText(line.voice)}</b><span class="small-note">${safeText(TYPES[line.type]?.[0]||line.type)}</span><p>${safeText(line.text.slice(0,350))}</p></div>`).join('');
 openModal('Retomar o fio do raciocínio',`<p class="small-note">Última sessão ou pausa: ${safeText(niceDate(lastAt))}. ${rec.truncated?'Mostrando as últimas etapas do caminho.':'Caminho desde a pergunta principal.'}</p><div class="recap-list">${lines}</div><p class="small-note">Este resumo é feito pelos próprios blocos e conexões; não é uma interpretação automática das suas ideias.</p><div class="modal-actions"><button class="secondary" data-close-modal>Agora não</button><button id="confirmResume" class="primary">↗ Retomar e destacar caminho</button></div>`,el=>{
 el.querySelector('#confirmResume').onclick=()=>{closeModal();if(r.status!=='em andamento')mutation(()=>{r.status='em andamento';r.completedAt=null;});startTracking();highlightPath(rec.path);focusNode(target.id);toast('Caminho destacado por 45 segundos. Continue quando quiser.');};
 },{wide:true});
}
function clearJourneyHighlight(){clearTimeout(journeyTimer);journeyTimer=null;journeyNodes=new Set();journeyEdges=new Set();if($('journeyBanner'))$('journeyBanner').classList.add('hidden');if(activeId&&view==='map')renderGraph();}
function highlightPath(path){clearJourneyHighlight();journeyNodes=new Set(path.map(p=>p.id));journeyEdges=new Set(path.map(p=>p.edgeId).filter(Boolean));$('journeyBanner').classList.remove('hidden');renderGraph();journeyTimer=setTimeout(clearJourneyHighlight,45000);}

function renderHistory(){const r=reflect();if(!r)return;const arr=[...r.nodes].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
 $('historyList').innerHTML=arr.length?arr.map((n,i)=>{const v=voice(n.voiceId),links=r.edges.filter(e=>e.source===n.id);
 return `<article class="history-item"><div class="meta">${i+1} · ${niceDate(n.createdAt)} · ${safeText(TYPES[n.type]?.[0]||n.type)} · ${safeText(v?.name||'Sem voz')} · ${safeText(STATES[n.state])}</div><h3>${safeText(labelOf(n))}</h3><p>${safeText(n.content)}</p>${n.notes?`<p><i>Observações: ${safeText(n.notes)}</i></p>`:''}${n.annotations?.length?`<div class="history-notes">${n.annotations.map(a=>`<p>◫ Nota: ${safeText(a.text)}</p>`).join('')}</div>`:''}<div class="links">${links.map(e=>`${safeText(RELATIONS[e.relation])} → ${safeText(labelOf(node(e.target)||{title:'Bloco ausente'}))}`).join(' · ')||'Nenhuma saída'}</div><button data-jump="${safeText(n.id)}">Ver no mapa →</button></article>`;}).join(''):'<p>Histórico vazio. Crie o primeiro pensamento.</p>';
}
function nextPosition(from){const r=reflect();if(!from){const {width,height}=canvasSize();let x=(width/2-pan.x)/zoom-140,y=(height/2-pan.y)/zoom-100;
 while(r.nodes.some(n=>Math.abs(n.x-x)<210&&Math.abs(n.y-y)<160)){y+=230;}return {x:Math.round(x),y:Math.round(y)};}
 const others=r.edges.filter(e=>e.source===from.id&&e.relation!=='retorna');let x=from.x+355,y=from.y+(others.length?others.length*240-120:0);
 while(r.nodes.some(n=>Math.abs(n.x-x)<240&&Math.abs(n.y-y)<165)){y+=235;}return {x,y};}
function openNodeEditor(existingId=null,config={}){const r=reflect();if(!r)return;const existing=existingId?node(existingId):null,parent=config.parentId?node(config.parentId):null;
 const defaults={type:config.type||'comentario',title:config.title||'',content:config.content||'',notes:'',classification:config.classification||'',state:'ativo',voiceId:config.voiceId||parent?.voiceId||r.voices[0]?.id};
 const n=existing||defaults,autoDefault=!existing&&!config.type;
 const label=existing?'Editar pensamento':parent?'Continuar raciocínio':'Novo pensamento';
 const voiceField=selectField('voiceId','Voz interna',r.voices.map(v=>[v.id,v.name]),n.voiceId);
 const selectWithHelp=(name,text,entries,selected)=>`${selectField(name,text,entries,selected)}<div class="term-definition" data-definition-for="${name}"></div>`;
 openModal(label,`<form id="activeForm"><div class="form-grid">${selectWithHelp('type','Tipo de bloco',Object.entries(TYPES).map(([k,t])=>[k,t[0]]),n.type)}${voiceField}</div>
 ${field('title','Título breve (opcional)',n.title||'','input',false,'maxlength="250"')}
 ${field('content','Escreva livremente, sem se preocupar com os termos',n.content||'','textarea',true,'autofocus maxlength="30000" rows="5"')}
 <div class="assist-box"><div class="assist-heading"><b>✦ Assistente de classificação local</b><label class="assist-toggle"><input type="checkbox" id="autoClassify" ${autoDefault?'checked':''}/> Aplicar sugestões enquanto escrevo</label></div>
 <div id="inferenceResult" class="assist-result" aria-live="polite">Escreva para receber sugestões.</div><div class="assist-actions"><button type="button" class="secondary small" id="applySuggestion">Aplicar sugestão</button><span class="small-note">Regras simples, sem IA externa. Você tem a palavra final.</span></div></div>
 <div class="form-grid">${selectWithHelp('classification','Natureza da frase',Object.entries(CLASSES),n.classification)}${selectField('state','Estado do pensamento',Object.entries(STATES),n.state)}</div>
 ${parent&&!existing?selectWithHelp('relation','Ligação com o bloco anterior',Object.entries(RELATIONS),config.relation||'continua'):''}
 ${field('notes','Contexto adicional (opcional)',n.notes||'','textarea',false,'maxlength="30000" rows="2"')}
 <div class="field-hint">Dica: uma hipótese não vira fato por ser sugerida. Uma emoção não é erro lógico. Comentários e pausas também fazem parte do caminho.</div>
 <div class="modal-actions"><button type="button" class="secondary" data-close-modal>Cancelar</button><button type="submit" class="primary">${existing?'Salvar alterações':'Adicionar ao mapa'}</button></div></form>`,el=>{
 const form=el.querySelector('#activeForm'),content=form.elements.content,auto=form.querySelector('#autoClassify'),result=form.querySelector('#inferenceResult'),apply=form.querySelector('#applySuggestion');
 const refresh=()=>{const text=content.value.trim(),guess=suggestThought(text);if(!text){result.textContent='Digite sua ideia para receber uma sugestão. Você também pode escolher o tipo manualmente.';apply.disabled=true;return;}
 apply.disabled=false;
 const t=TYPES[guess.type]?.[0]||'Sem sugestão',cls=CLASSES[guess.classification]||'Não classificado';
 result.innerHTML=`<div><b>Sugestão: ${safeText(t)}</b> <span class="confidence">Confiança ${safeText(guess.confidence)}</span></div><p>${safeText(guess.explanation)}</p><small>Natureza: <b>${safeText(cls)}</b> — ${safeText(guess.classificationExplanation||'')}</small>${guess.alternatives.length?`<div class="other-types">Alternativas: ${guess.alternatives.map(k=>`<button type="button" class="secondary small" data-alternative="${safeText(k)}">${safeText(TYPES[k]?.[0]||k)}</button>`).join('')}</div>`:''}`;
 if(auto.checked){form.elements.type.value=guess.type;form.elements.classification.value=guess.classification;setupDefinitionFields();}
 };
 const setupDefinitionFields=()=>{for(const name of ['type','classification','relation']){const ctl=form.elements[name],target=el.querySelector(`[data-definition-for="${name}"]`);if(ctl&&target)target.innerHTML=termHTML(name==='type'?'types':name==='classification'?'classes':'relations',ctl.value);}};
 for(const name of ['type','classification'])form.elements[name].addEventListener('change',()=>{auto.checked=false;setupDefinitionFields();});
 form.elements.relation?.addEventListener('change',setupDefinitionFields);
 auto.addEventListener('change',refresh);content.addEventListener('input',refresh);
 apply.addEventListener('click',()=>{if(!content.value.trim())return;const g=suggestThought(content.value);form.elements.type.value=g.type;form.elements.classification.value=g.classification;setupDefinitionFields();toast('Sugestão aplicada. Você ainda pode mudar o tipo.');});
 el.addEventListener('click',e=>{const b=e.target.closest('[data-alternative]');if(!b)return;form.elements.type.value=b.dataset.alternative;auto.checked=false;setupDefinitionFields();});
 form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form),thought=String(data.get('content')||'').trim();if(!thought)return toast('Escreva o pensamento antes de salvar.');
 const ts=now();let id=existingId;
 mutation(()=>{if(existing){Object.assign(existing,{type:data.get('type'),voiceId:data.get('voiceId'),title:String(data.get('title')||'').trim(),content:thought,classification:data.get('classification'),state:data.get('state'),notes:String(data.get('notes')||'').trim(),updatedAt:ts});}
 else {id=uid('node');const pos=nextPosition(parent);r.nodes.push({id,x:pos.x,y:pos.y,type:data.get('type'),voiceId:data.get('voiceId'),title:String(data.get('title')||'').trim(),content:thought,notes:String(data.get('notes')||'').trim(),annotations:[],classification:data.get('classification'),state:data.get('state'),collapsed:false,createdAt:ts,updatedAt:ts});
 if(parent)r.edges.push({id:uid('edge'),source:parent.id,target:id,relation:data.get('relation')||config.relation||'continua',createdAt:ts});
 if(config.returnToRoot&&r.nodes[0]?.id!==id)r.edges.push({id:uid('edge'),source:id,target:r.nodes[0].id,relation:'retorna',createdAt:ts});
 if(config.markPaused){r.status='pausado';const closure={kind:'pausa',note:thought.slice(0,5000),at:ts};r.closure=closure;r.closures||=[];r.closures.push(closure);}}
 });
 closeModal();if(!existingId)clearJourneyHighlight();if(config.markPaused)stopTracking();focusNode(id);if(isMobile())$('inspector').classList.add('hidden');toast(existing?'Pensamento atualizado.':config.markPaused?'Pausa registrada. A reflexão foi marcada como pausada.':'Pensamento adicionado.');
 if(!existingId&&parent&&Date.parse(ts)-Date.parse(parent.createdAt)>=60*60000)toast('Possível pausa de mais de 1 hora neste caminho. Veja Organizar → Procurar pausas.',{duration:6500});
 });
 setupDefinitionFields();refresh();
 });}
// Análise em lote, inteiramente local. Apenas a confirmação do usuário altera dados.
function batchClassify(){
 const r=reflect();if(!r)return;
 const plan=planBulkClassification(r);
 const rows=plan.changes;
 if(!rows.length){
  const stats=summarizeBulkClassification(plan,[]);
  openModal('Análise concluída',`${batchSummaryHTML(stats)}<div class="modal-actions"><button type="button" class="primary" data-close-modal>Entendi</button></div>`,()=>()=>batchToast(stats));
  return;
 }
 const summary=`<p class="small-note">${r.nodes.length} blocos analisados · <b>${rows.length} com sugestões de alteração</b>. Isto é um sistema de regras locais, não uma IA externa. Revise as classificações antes de aceitar. <b>Fatos marcados manualmente não são reclassificados automaticamente.</b></p>`;
 const cards=rows.map((entry,i)=>{
  const n=r.nodes.find(item=>item.id===entry.id);
  const currentType=TYPES[entry.before.type]?.[0]||entry.before.type;
  const nextType=TYPES[entry.after.type]?.[0]||entry.after.type;
  const currentClass=CLASSES[entry.before.classification]||'Não classificado';
  const nextClass=CLASSES[entry.after.classification]||'Não classificado';
  return `<label class="batch-row"><input type="checkbox" data-batch-index="${i}" checked aria-label="Aplicar sugestão no bloco ${i+1}"><span class="batch-description"><strong>${safeText(n?.title||'Bloco '+(i+1))}</strong><span class="batch-excerpt">${safeText(n?.content.slice(0,210)||'')}</span><span class="batch-diff">${entry.before.type!==entry.after.type?`Tipo: <s>${safeText(currentType)}</s> → <b>${safeText(nextType)}</b>`:''}${entry.before.type!==entry.after.type&&entry.before.classification!==entry.after.classification?' · ':''}${entry.before.classification!==entry.after.classification?`Natureza: <s>${safeText(currentClass)}</s> → <b>${safeText(nextClass)}</b>`:''}</span><span class="batch-reason">Confiança ${safeText(entry.confidence)} · ${safeText(entry.explanation)}</span></span></label>`;
 }).join('');
 openModal('Revisar classificações do mapa',`${summary}<label class="batch-select-all"><input type="checkbox" id="selectBatchAll" checked> Selecionar todas as sugestões</label><div class="batch-list" id="batchList">${cards}</div><div class="modal-actions"><button class="secondary" type="button" data-close-modal>Cancelar</button><button class="primary" type="button" id="applyBatch">Aplicar ${rows.length} sugestões</button></div>`,el=>{
  const all=el.querySelector('#selectBatchAll');const cbs=[...el.querySelectorAll('[data-batch-index]')];const submit=el.querySelector('#applyBatch');
  const update=()=>{const n=cbs.filter(c=>c.checked).length;all.checked=n===cbs.length;all.indeterminate=n>0&&n<cbs.length;submit.disabled=n===0;submit.textContent=`Aplicar ${n} sugestão${n===1?'':'ões'}`;};
  all.onchange=()=>{cbs.forEach(cb=>cb.checked=all.checked);update();};
  cbs.forEach(cb=>cb.onchange=update);
  submit.onclick=()=>{
   const accepted=cbs.filter(c=>c.checked).map(cb=>rows[Number(cb.dataset.batchIndex)]);
   if(!accepted.length)return;
   const ids=new Set(accepted.map(item=>item.id));
   mutation(()=>{const ts=now();for(const n of r.nodes){if(!ids.has(n.id))continue;const change=accepted.find(item=>item.id===n.id);if(!change)continue;n.type=change.after.type;n.classification=change.after.classification;n.updatedAt=ts;}});
   const stats=summarizeBulkClassification(plan,accepted.map(x=>x.id));
   showBatchReview(accepted,stats);
  };
 },{wide:true});
}
function showBatchReview(changes,stats){
 const items=changes.map(entry=>{
  const n=node(entry.id);if(!n)return '';
  return `<div class="batch-result"><span><b>${safeText(labelOf(n))}</b><small>${safeText(TYPES[n.type]?.[0]||n.type)} · ${safeText(CLASSES[n.classification]||'Não classificado')}</small></span><button type="button" class="secondary small" data-review-node="${safeText(n.id)}">Revisar</button></div>`;
 }).join('');
 let notifyWhenClosed=true;
 openModal('Resumo das sugestões aplicadas',`${batchSummaryHTML(stats)}<p class="small-note">Suas notas, vozes, conexões e posições foram preservadas. Use <b>Revisar</b> para corrigir cada bloco ou <b>Desfazer lote</b> para recuperar as classificações anteriores em uma única ação. Se editar outro bloco antes, o histórico de desfazer seguirá a ordem das alterações.</p><div class="batch-list">${items}</div><div class="modal-actions"><button class="secondary" id="revertBatch" type="button">↶ Desfazer lote</button><button class="primary" type="button" data-close-modal>Concluir revisão depois</button></div>`,el=>{
  el.querySelector('#revertBatch').onclick=()=>{notifyWhenClosed=false;closeModal();undoAction();toast('Lote desfeito; classificações anteriores restauradas.');};
  el.querySelectorAll('[data-review-node]').forEach(button=>button.onclick=()=>{notifyWhenClosed=false;const id=button.dataset.reviewNode;closeModal();focusNode(id);openNodeEditor(id);});
  return ()=>{if(notifyWhenClosed)batchToast(stats);};
 },{wide:true});
}
const QUICK = {
 continue:()=>({relation:'continua'}),question:()=>({type:'pergunta',relation:'continua'}),
 object:()=>({type:'objecao',relation:'contesta',voiceId:'eu2'}),respond:()=>({relation:'continua'}),
 example:()=>({type:'exemplo',relation:'exemplifica'}),scenario:()=>({type:'cenario',relation:'continua'}),
 emotion:()=>({type:'emocao',relation:'continua',classification:'sentimento'}),conclude:()=>({type:'provisoria',relation:'reformula'}),
 branch:()=>({type:'pergunta',title:'Nova ramificação',relation:'continua'}),return:()=>({type:'retorno',title:'Retorno ao tema',relation:'continua',returnToRoot:true}),
 comment:()=>({type:'comentario',relation:'continua'}),pause:()=>({type:'pausa',relation:'continua',markPaused:true}),
 agree:()=>({type:'acordo',relation:'apoia'}),meta:()=>({type:'meta',relation:'continua'}),plan:()=>({type:'roteiro',relation:'continua'})};
function quick(action){const n=node(selectedId);if(!n)return toast('Selecione um pensamento primeiro.');const config=QUICK[action]?.(n);if(config)openNodeEditor(null,{...config,parentId:n.id});}
function removeNode(){const n=node(selectedId);if(!n)return;
 if(!confirm(`Excluir o bloco “${labelOf(n)}” e suas conexões?\n\nOs demais blocos serão preservados.`))return;
 mutation(()=>{const r=reflect();r.nodes=r.nodes.filter(x=>x.id!==n.id);r.edges=r.edges.filter(e=>e.source!==n.id&&e.target!==n.id);selectedId=null;});toast('Bloco excluído. Use desfazer para recuperá-lo.');}
function connectModal(sourceId=selectedId){const r=reflect();if(r.nodes.length<2)return toast('Crie pelo menos dois pensamentos para conectá-los.');const chosen=sourceId&&node(sourceId)?sourceId:r.nodes[0].id;
 formModal('Conectar pensamentos',`${selectField('from','Pensamento de origem',r.nodes.map(n=>[n.id,labelOf(n)]),chosen)}${selectField('to','Pensamento de destino',r.nodes.map(n=>[n.id,labelOf(n)]),r.nodes.find(n=>n.id!==chosen)?.id)}${selectField('relation','Significado da conexão',Object.entries(RELATIONS),'continua')}<p class="small-note">Você também pode ligar um bloco atual a um pensamento antigo, criar ciclos de revisão ou retornar à pergunta principal.</p>`,'Criar conexão',data=>{
 const source=data.get('from'),target=data.get('to'),relation=data.get('relation');if(source===target)return toast('Selecione dois blocos diferentes.'),false;
 if(r.edges.some(e=>e.source===source&&e.target===target&&e.relation===relation))return toast('Esta conexão já existe.'),false;
 mutation(()=>r.edges.push({id:uid('edge'),source,target,relation,createdAt:now()}));toast('Conexão criada.');return true;});}
function editEdge(id){const r=reflect(),e=r?.edges.find(x=>x.id===id);if(!e)return;
 openModal('Editar conexão',`<p class="small-note"><b>${safeText(labelOf(node(e.source)))}</b> → <b>${safeText(labelOf(node(e.target)))}</b></p><form id="edgeForm">${selectField('relation','Esta conexão representa',Object.entries(RELATIONS),e.relation)}<div class="modal-actions"><button type="button" class="secondary danger-outline" id="removeEdge">Excluir conexão</button><button type="submit" class="primary">Salvar</button></div></form>`,el=>{
 el.querySelector('#edgeForm').onsubmit=ev=>{ev.preventDefault();mutation(()=>e.relation=new FormData(ev.currentTarget).get('relation'));closeModal();};
 el.querySelector('#removeEdge').onclick=()=>{if(!confirm('Excluir esta conexão? Os blocos serão preservados.'))return;mutation(()=>r.edges=r.edges.filter(x=>x.id!==id));closeModal();};
 });}
function challenge(){const n=node(selectedId);if(!n)return toast('Selecione um pensamento antes de desafiar.');let i=Math.floor(Math.random()*PROMPTS.length);
 openModal('✦ Desafiar pensamento',`<div class="small-note">Uma provocação para explorar possibilidades, não um julgamento sobre o que você sente.</div><div class="challenge-question" id="challengeQuestion">${safeText(PROMPTS[i])}</div><div class="challenge-num" id="challengeNumber">Pergunta ${i+1} de ${PROMPTS.length}</div><div class="modal-actions"><button class="secondary" id="nextChallenge">↻ Outra pergunta</button><button class="primary" id="answerChallenge">Responder no mapa ↗</button></div>`,el=>{
 el.querySelector('#nextChallenge').onclick=()=>{i=(i+1)%PROMPTS.length;el.querySelector('#challengeQuestion').textContent=PROMPTS[i];el.querySelector('#challengeNumber').textContent=`Pergunta ${i+1} de ${PROMPTS.length}`;};
 el.querySelector('#answerChallenge').onclick=()=>openNodeEditor(null,{parentId:n.id,type:'pergunta',relation:'contesta',title:'Provocação',content:PROMPTS[i],voiceId:rVoice('eu2')});
 });}
function rVoice(preferred){return reflect().voices.find(v=>v.id===preferred)?.id||reflect().voices[0]?.id;}
function toggleCollapse(id){const n=node(id);if(!n)return;mutation(()=>n.collapsed=!n.collapsed);}
function autoLayout(){const r=reflect();if(!r?.nodes.length)return;mutation(()=>{
 const byId=new Map(r.nodes.map(n=>[n.id,n])),layers=new Map(),queue=[];
 const indegree=new Map(r.nodes.map(n=>[n.id,0]));for(const e of r.edges)if(e.relation!=='retorna'&&byId.has(e.source)&&byId.has(e.target))indegree.set(e.target,indegree.get(e.target)+1);
 for(const n of r.nodes)if(indegree.get(n.id)===0){layers.set(n.id,0);queue.push(n.id);}
 if(!queue.length){layers.set(r.nodes[0].id,0);queue.push(r.nodes[0].id);}
 let step=0;while(queue.length&&step<r.nodes.length*4){step++;const id=queue.shift(),depth=layers.get(id);if(depth>=12)continue;
 for(const e of r.edges.filter(e=>e.source===id&&e.relation!=='retorna')){
 if(!byId.has(e.target)||layers.has(e.target))continue;layers.set(e.target,depth+1);queue.push(e.target);}}
 for(const n of r.nodes)if(!layers.has(n.id))layers.set(n.id,0);
 const groups=new Map();for(const n of r.nodes){const d=layers.get(n.id);if(!groups.has(d))groups.set(d,[]);groups.get(d).push(n);}
 for(const [depth,nodes]of groups){nodes.sort((a,b)=>a.y-b.y);const offset=(nodes.length-1)*230/2;nodes.forEach((n,i)=>{n.x=depth*365;n.y=i*230-offset;});}
 });fitMap();toast('Mapa reorganizado. Use desfazer se preferir o layout anterior.');}
function editVoices(){const r=reflect();if(!r)return;
 const show=()=>{openModal('Minhas vozes internas',`<p class="small-note">As vozes representam pontos de vista que você escolhe explorar, não personalidades independentes.</p><div class="modal-scroll" id="voiceList">${r.voices.map(v=>`<div class="voice-row"><i class="voice-color" style="background:${safeText(v.color)}"></i><span>${safeText(v.name)}</span><button data-renamevoice="${safeText(v.id)}">Editar</button><button data-deletevoice="${safeText(v.id)}">Excluir</button></div>`).join('')}</div><div class="modal-actions"><button class="secondary" data-close-modal>Fechar</button><button class="primary" id="createVoice">＋ Nova voz</button></div>`,el=>{
 el.querySelector('#createVoice').onclick=()=>voiceForm(null,show);
 el.querySelectorAll('[data-renamevoice]').forEach(b=>b.onclick=()=>voiceForm(b.dataset.renamevoice,show));
 el.querySelectorAll('[data-deletevoice]').forEach(b=>b.onclick=()=>{const v=voice(b.dataset.deletevoice);if(r.voices.length<=1)return toast('Mantenha pelo menos uma voz.');if(!confirm(`Excluir a voz “${v.name}”? Os blocos serão associados à primeira voz disponível.`))return;
 mutation(()=>{r.voices=r.voices.filter(x=>x.id!==v.id);r.nodes.filter(n=>n.voiceId===v.id).forEach(n=>n.voiceId=r.voices[0].id);});show();});
 });};show();}
function voiceForm(id,done){const r=reflect(),v=id?voice(id):null;
 formModal(v?'Editar voz interna':'Nova voz interna',`${field('name','Nome da perspectiva',v?.name||'','input',true,'autofocus maxlength="60"')}<div class="field"><label for="f_color">Cor da perspectiva</label><input id="f_color" type="color" name="color" value="${v?.color||'#9cafff'}" style="width:85px;height:48px;padding:4px" /></div>`,'Salvar voz',data=>{
 const name=data.get('name').trim();if(!name)return false;
 mutation(()=>{if(v){v.name=name;v.color=data.get('color');}else r.voices.push({id:uid('voice'),name,color:data.get('color')});});
 queueMicrotask(done);return true;});}
function exportModal(){if(!reflect())return;const opts=[['md','☷','Texto estruturado (.md)','Argumentos, vozes, conexões e ordem cronológica'],['svg','◇','Mapa em SVG','Imagem vetorial do mapa inteiro, sem cortes'],['png','▧','Mapa em PNG','Imagem PNG com todos os blocos e conexões'],['json','{}','Backup completo (.json)','Dados, posições, vozes e configurações da biblioteca'],['ai','✦','Prompt crítico aprofundado','Análise rigorosa com IDs, valores, hipóteses, falácias e sugestões para novos blocos'],['therapyai','✧','Prompt para resumo de sessão','Solicita resumo acessível e cuidadoso a uma IA externa'],['therapy','♡','Resumo para levar à sessão (.md)','Resumo literal dos trechos sinalizados, emoções e perguntas abertas'],['share','♧','Apresentação interativa (.html)','Leitura por etapas, mapa, resumo, impressão/PDF e prévia privada'],['importai','↗','Importar sugestões da IA','Revise propostas do ChatGPT e adicione como novos blocos'],['chess','♟','Prompt de xadrez de argumentos','Copiar instruções para converter o debate em partida narrativa'],['report','◷','Relatório final ou parcial (.md)','Métricas, sessões, tipos e possíveis falácias']];
 openModal('Exportar reflexão',`<p class="small-note">Apenas quando você escolher exportar ou copiar haverá uma cópia dos dados fora do armazenamento local.</p>${opts.map(([a,ic,name,desc])=>`<button class="export-option" data-export="${a}"><span class="symbol">${ic}</span><span><b>${name}</b><small>${desc}</small></span></button>`).join('')}`,el=>el.querySelectorAll('[data-export]').forEach(b=>b.onclick=async()=>{
 const type=b.dataset.export,r=reflect();try{
 if(type==='md')downloadText(`${cleanFilename(r.title)}.md`,markdownFor(r),'text/markdown;charset=utf-8');
 else if(type==='svg'||type==='png')await downloadSvgOrPng(r,type);
 else if(type==='json')downloadText(`contraponto-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(app,null,2),'application/json;charset=utf-8');
 else if(type==='ai'){await copyText(promptFor(r));toast('Prompt e raciocínio copiados. Cole onde desejar.');closeModal();return;}
 else if(type==='chess'){closeModal();copyChessPrompt();return;}
 else if(type==='therapyai'){await copyText(analysisPrompt(r,{audience:'therapy'}));toast('Prompt para resumo de sessão copiado. Revise o conteúdo antes de enviar à IA.');closeModal();return;}
 else if(type==='therapy')downloadText(`${cleanFilename(r.title)}-para-conversar.md`,discussionSummary(r),'text/markdown;charset=utf-8');
 else if(type==='share'){closeModal();sharePresentation();return;}
 else if(type==='importai'){closeModal();importAISuggestions();return;}

 else if(type==='report')downloadText(`${cleanFilename(r.title)}-relatorio.md`,reportMarkdown(r),'text/markdown;charset=utf-8');
 toast('Exportação iniciada.');closeModal();}catch(err){console.error(err);toast(err.message||'Não foi possível exportar.');}
 }));}
async function copyText(str){if(navigator.clipboard&&isSecureContext)return navigator.clipboard.writeText(str);
 const t=document.createElement('textarea');t.value=str;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('Não foi possível copiar automaticamente. Use o navegador em HTTPS ou localhost.');}
function importJson(){ $('jsonFileInput').value='';$('jsonFileInput').click();}
async function receiveImport(file){if(!file)return;if(file.size>15*1024*1024)return toast('Arquivo maior que 15 MB.');let refs,importedSettings=null;
 try{const raw=JSON.parse(await file.text());refs=normalizeImported(raw);if(raw.settings&&typeof raw.settings==='object')importedSettings={theme:raw.settings.theme==='light'?'light':'dark'};}catch(e){console.error(e);return toast(e.message||'JSON inválido.');}
 openModal('Importar backup',`<p>Encontradas <b>${refs.length}</b> reflexões no arquivo.</p><p class="small-note">Ao adicionar, as reflexões existentes são preservadas. Ao substituir, a biblioteca atual será apagada e receberá o conteúdo importado.</p><div class="modal-actions"><button class="secondary" data-close-modal>Cancelar</button><button class="secondary" id="importReplace">Substituir biblioteca</button><button class="primary" id="importAppend">Adicionar reflexões</button></div>`,el=>{
 el.querySelector('#importReplace').onclick=()=>{if(!confirm('Substituir TODA a biblioteca local por este backup? Isso não pode ser desfeito sem outro backup.'))return;
 stopTracking();app.reflections=refs;if(importedSettings){app.settings=importedSettings;applyTheme();}activeId=null;selectedId=null;closeModal();persist();renderLibrary();toast('Biblioteca restaurada.');};
 el.querySelector('#importAppend').onclick=()=>{
 const imported=clone(refs),exists=new Set(app.reflections.map(r=>r.id));for(const r of imported){if(exists.has(r.id)){r.id=uid('reflection');}exists.add(r.id);}
 stopTracking();app.reflections.push(...imported);activeId=null;selectedId=null;closeModal();persist();renderLibrary();toast(`${imported.length} reflexão(ões) importada(s).`);};
 });}

let graphDrag=null,panDrag=null;
function wireGraph(){const viewport=$('graphViewport'),nodes=$('graphNodes'),edges=$('graphEdges');
 nodes.addEventListener('pointerdown',e=>{
 const element=e.target.closest('[data-node]');if(!element||e.button>0)return;
 e.stopPropagation();if(e.pointerType==='touch')e.preventDefault();const id=element.dataset.node,n=node(id);if(!n)return;
 selectNode(id);$('graphViewport').focus({preventScroll:true});graphDrag={id,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,origX:n.x,origY:n.y,old:clone(reflect()),moved:false};
 element.setPointerCapture(e.pointerId);
 });
 nodes.addEventListener('pointermove',e=>{if(!graphDrag||e.pointerId!==graphDrag.pointer)return;const n=node(graphDrag.id),el=nodes.querySelector(`[data-node="${CSS.escape(graphDrag.id)}"]`);if(!n||!el)return;
 const dx=(e.clientX-graphDrag.startX)/zoom,dy=(e.clientY-graphDrag.startY)/zoom;if(Math.abs(dx)<3&&Math.abs(dy)<3&&!graphDrag.moved)return;
 graphDrag.moved=true;n.x=Math.round(graphDrag.origX+dx);n.y=Math.round(graphDrag.origY+dy);el.style.left=n.x+'px';el.style.top=n.y+'px';renderEdges();drawMini();});
 const endDrag=e=>{if(!graphDrag||e.pointerId!==graphDrag.pointer)return;if(graphDrag.moved){pushCheckpoint(graphDrag.old);reflect().updatedAt=now();persist();renderWorkspace();}graphDrag=null;};
 nodes.addEventListener('pointerup',endDrag);nodes.addEventListener('pointercancel',endDrag);
 nodes.addEventListener('dblclick',e=>{const el=e.target.closest('[data-node]');if(!el)return;e.preventDefault();e.stopPropagation();if(e.target.closest('.collapse-indicator'))return toggleCollapse(el.dataset.node);showReader(el.dataset.node);});
 edges.addEventListener('click',e=>{const id=e.target.dataset.edge;if(id){e.stopPropagation();editEdge(id);}});
 viewport.addEventListener('pointerdown',e=>{if(e.button>0||e.target.closest('.thought-node')||e.target.closest('.edge-hit')||e.target.closest('button, .journey-banner, .path-navigator'))return;
 panDrag={pointer:e.pointerId,startX:e.clientX,startY:e.clientY,origX:pan.x,origY:pan.y};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');if(selectedId){selectedId=null;renderGraph();$('inspector').classList.add('hidden');}});
 viewport.addEventListener('pointermove',e=>{if(!panDrag||e.pointerId!==panDrag.pointer)return;pan.x=panDrag.origX+(e.clientX-panDrag.startX);pan.y=panDrag.origY+(e.clientY-panDrag.startY);updateTransform();drawMini();});
 const endPan=e=>{if(panDrag?.pointer===e.pointerId){panDrag=null;viewport.classList.remove('panning');}};
 viewport.addEventListener('pointerup',endPan);viewport.addEventListener('pointercancel',endPan);
 viewport.addEventListener('wheel',e=>{e.preventDefault();const rect=viewport.getBoundingClientRect();setZoom(zoom*Math.exp(-e.deltaY*.0013),e.clientX-rect.left,e.clientY-rect.top);},{passive:false});
 $('miniMap').addEventListener('click',e=>{if(!miniExtent)return;const rect=$('miniMapSvg').getBoundingClientRect();const x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));
 const worldX=miniExtent.left+x*(miniExtent.right-miniExtent.left),worldY=miniExtent.top+y*(miniExtent.bottom-miniExtent.top);const size=canvasSize();pan.x=size.width/2-worldX*zoom;pan.y=size.height/2-worldY*zoom;updateTransform();drawMini();});
}
// Exportações privadas: prévia isolada; nada é publicado no GitHub Pages nem enviado a um servidor.
function sharePresentation(){const r=reflect();if(!r)return;
 openModal('♧ Apresentação guiada para compartilhar',`<p class="small-note">Crie um documento HTML autônomo e somente leitura. A pessoa poderá acompanhar as falas, escolher ramificações, consultar o mapa e imprimir/salvar como PDF pelo navegador.</p>
 <div class="private-warning"><b>Privacidade:</b> este HTML contém o conteúdo escolhido da reflexão. Qualquer pessoa com acesso ao arquivo poderá lê-lo. Ocultar nomes de vozes NÃO remove informações pessoais escritas dentro dos blocos. Revise antes de enviar; não publique no GitHub ou em links públicos.</div>
 <div class="share-options"><label><input type="checkbox" id="shareAnon"/> Substituir nomes das vozes por “Perspectiva 1, 2...” (não anonimiza o conteúdo)</label><label><input type="checkbox" id="shareNotes"/> Incluir anotações privadas e contexto adicional (desmarcado por segurança)</label><label><input type="checkbox" id="shareFallacies"/> Incluir marcações de possíveis falácias (desmarcado por segurança)</label></div>
 <div class="modal-actions"><button class="secondary" id="previewShared">▣ Pré-visualizar</button><button class="secondary" id="downloadSummaryTherapy">↓ Resumo para sessão</button><button class="primary" id="downloadShared">↓ Baixar HTML</button></div><div id="presentationPreview"></div>`,el=>{
 const options=()=>({anonymizeVoices:el.querySelector('#shareAnon').checked,includeNotes:el.querySelector('#shareNotes').checked,includeFallacies:el.querySelector('#shareFallacies').checked});
 el.querySelector('#downloadShared').onclick=()=>{downloadText(`${cleanFilename(r.title)}-apresentacao.html`,makePresentationHTML(r,options()),'text/html;charset=utf-8');toast('HTML baixado. Confira o conteúdo antes de enviar.');};
 el.querySelector('#downloadSummaryTherapy').onclick=()=>downloadText(`${cleanFilename(r.title)}-para-conversar.md`,discussionSummary(r),'text/markdown;charset=utf-8');
 el.querySelector('#previewShared').onclick=()=>{const host=el.querySelector('#presentationPreview');host.replaceChildren();const iframe=document.createElement('iframe');iframe.className='share-preview';iframe.title='Prévia da apresentação privada';iframe.setAttribute('sandbox','allow-scripts allow-modals');iframe.srcdoc=makePresentationHTML(r,options());host.append(iframe);iframe.scrollIntoView({behavior:'smooth',block:'nearest'});};
 },{wide:true});
}
function markForDiscussion(){const n=node(selectedId);if(!n)return;
 openModal('★ Marcar para conversar',`<p class="small-note">Este marcador identifica um trecho que você quer discutir com alguém. Não é uma avaliação psicológica ou classificação automática.</p><form id="discussionForm">${selectField('key','Por que destacar este pensamento?',Object.entries(DISCUSSION_TAGS),'conversar')}${field('note','Minha observação (opcional)','', 'textarea',false,'maxlength="1500" rows="3"')}<div class="modal-actions"><button type="button" class="secondary" data-close-modal>Cancelar</button><button type="submit" class="primary">★ Adicionar marcador</button></div></form>`,el=>{
 el.querySelector('#discussionForm').onsubmit=e=>{e.preventDefault();const data=new FormData(e.currentTarget),key=data.get('key');if(!DISCUSSION_TAGS[key])return;mutation(()=>{n.discussion||=[];n.discussion.push({id:uid('mark'),key,label:DISCUSSION_TAGS[key],note:String(data.get('note')||'').trim(),createdAt:now()});n.updatedAt=now();});closeModal();toast('Trecho marcado para conversar.');};
 });
}
function removeDiscussionMark(id){const n=node(selectedId);if(!n||!n.discussion?.some(d=>d.id===id))return;
 mutation(()=>{n.discussion=n.discussion.filter(d=>d.id!==id);n.updatedAt=now();});toast('Marcador removido; o pensamento continua no mapa.');
}
function importAISuggestions(){const r=reflect();if(!r)return;
 openModal('↗ Importar propostas de novos pensamentos',`<p class="small-note">Cole o bloco JSON “suggestions” da análise feita por uma IA. Ele será analisado localmente. <b>Nada muda até você revisar e confirmar</b>. O texto enviado à IA é responsabilidade sua; evite dados que não deseja compartilhar.</p>${field('suggestions','Cole o JSON com as sugestões','','textarea',true,'rows="9" placeholder="{&quot;suggestions&quot;:[...]}"')}<div class="modal-actions"><button class="secondary" data-close-modal>Cancelar</button><button class="primary" id="reviewSuggestions">Revisar sugestões</button></div>`,el=>{
 el.querySelector('#reviewSuggestions').onclick=()=>{let parsed;try{parsed=parseNextSteps(el.querySelector('textarea').value,r);}catch(err){toast(err.message);return;}
 if(!parsed.suggestions.length)return toast(`${parsed.rejected} sugestão(ões) não aproveitadas. Verifique IDs, tipos e relações.`);
 openModal('Revisar novos blocos propostos',`<p class="small-note">${parsed.suggestions.length} sugestões compatíveis · ${parsed.rejected} inválida(s). As propostas são ideias de outra IA, não fatos comprovados. Escolha o que deseja adicionar. Os blocos originais não serão alterados.</p>
 <div class="modal-scroll">${parsed.suggestions.map(s=>`<label class="suggested-row"><input type="checkbox" data-suggest="${s.index}" checked/><span><b>${safeText(TYPES[s.type][0])}</b> · ${safeText(RELATIONS[s.relation])}<p>${safeText(s.text)}</p><small>Conectado a: ${safeText(labelOf(r.nodes.find(n=>n.id===s.sourceId)))}</small></span></label>`).join('')}</div><div class="modal-actions"><button class="secondary" data-close-modal>Cancelar</button><button class="primary" id="acceptSuggestions">Adicionar selecionados</button></div>`,panel=>{
 panel.querySelector('#acceptSuggestions').onclick=()=>{const chosen=new Set([...panel.querySelectorAll('[data-suggest]:checked')].map(x=>Number(x.dataset.suggest)));const accepted=parsed.suggestions.filter(s=>chosen.has(s.index));if(!accepted.length)return toast('Nenhum bloco selecionado.');
 mutation(()=>{for(const s of accepted){const parent=r.nodes.find(n=>n.id===s.sourceId);if(!parent)continue;const pos=nextPosition(parent);const ts=now(),id=uid('node');r.nodes.push({id,x:pos.x,y:pos.y,type:s.type,title:'',content:s.text,notes:'Proposta externa de IA aceita manualmente; não é um fato validado.',voiceId:r.voices.find(v=>v.id==='observador')?.id||r.voices[0].id,classification:'',state:'ativo',annotations:[],discussion:[],fallacies:[],collapsed:false,createdAt:ts,updatedAt:ts});r.edges.push({id:uid('edge'),source:parent.id,target:id,relation:s.relation,createdAt:ts});}});closeModal();toast(`${accepted.length} sugestão(ões) adicionada(s). Use Ctrl+Z para desfazer o lote.`,{duration:5500});};
 },{wide:true});
 };
 },{wide:true});
}
function showVersions(){const content=RELEASES.map(rel=>`<section class="version-entry"><h3>${safeText(rel.version)} — ${safeText(rel.name)}</h3>${rel.date?`<time>${safeText(rel.date)}</time>`:''}<ul>${rel.items.map(t=>`<li>${safeText(t)}</li>`).join('')}</ul></section>`).join('');
 openModal('Novidades · CONTRAPONTO v'+APP_VERSION,`<p class="small-note">Versão instalada: <b>${APP_VERSION}</b>. Todas as atualizações abaixo ficam disponíveis mesmo sem internet após o app estar instalado em cache.</p><div class="version-log">${content}</div><div class="modal-actions"><button class="secondary" id="restartTour">▶ Iniciar tutorial</button><button class="primary" data-close-modal>Entendi</button></div>`,el=>{el.querySelector('#restartTour').onclick=()=>{closeModal();startTutorial();};},{wide:true});
 app.settings.lastSeenVersion=APP_VERSION;persist();
}
function tourClearFocus(){if(tutorialHighlight){tutorialHighlight.classList.remove('tour-focus');tutorialHighlight=null;}}
function tourStop(complete=false){tourClearFocus();tutorialStep=-1;$('tourCard').classList.add('hidden');if(complete){app.settings.tutorialCompleted=true;persist();toast('Tutorial concluído! Você pode reabri-lo quando quiser.');}}
function startTutorial(){closeReader(false);closeModal();tourStop(false);tutorialOrigin=activeId;tutorialStep=activeId?2:0;tourRender();}
function tourRender(){if(tutorialStep<0)return;const step=TOUR_STEPS[tutorialStep];if(!step)return tourStop(true);
 tourClearFocus();if(step.location==='workspace'&&!activeId){const demo=app.reflections.find(r=>r.tags.includes('demonstração'));if(demo)openReflection(demo.id);else{const r=makeDemo();app.reflections.unshift(r);persist();openReflection(r.id);}}
 if(step.location==='library'&&activeId)goHome();
 if(isMobile()&&step.selector==='#graphViewport')$('sidebar').classList.add('mobile-hidden');
 const target=document.querySelector(step.selector);if(target){tutorialHighlight=target;target.classList.add('tour-focus');target.scrollIntoView({block:'nearest',behavior:'smooth'});}
 $('tourCard').classList.remove('hidden');$('tourCard').innerHTML=`<div class="tour-count">PASSO ${tutorialStep+1} DE ${TOUR_STEPS.length} · GUIA INTERATIVO</div><h2>${safeText(step.title)}</h2><p>${safeText(step.description)}</p><div class="tour-actions"><button class="secondary" id="skipTour">Pular</button><button class="secondary" id="tourPrev" ${tutorialStep===0?'disabled':''}>← Voltar</button><button class="primary" id="tourNext">${tutorialStep===TOUR_STEPS.length-1?'Concluir ✓':'Próximo →'}</button></div>`;
 $('skipTour').onclick=()=>tourStop();$('tourPrev').onclick=()=>{tutorialStep--;tourRender();};$('tourNext').onclick=()=>{tutorialStep++;tourRender();};
}
function wireEvents(){
 $('brandBtn').onclick=goHome;$('backHome').onclick=goHome;$('themeBtn').onclick=()=>{app.settings.theme=app.settings.theme==='dark'?'light':'dark';applyTheme();persist();};
 $('globalTour').onclick=startTutorial;$('tourLibrary').onclick=startTutorial;$('tourSidebar').onclick=startTutorial;
 $('globalVersion').onclick=showVersions;
 $('shareBtn').onclick=sharePresentation;$('shareSidebar').onclick=sharePresentation;$('analysisImportSidebar').onclick=importAISuggestions;
 $('globalImport').onclick=importJson;$('globalGlossary').onclick=glossaryModal;$('glossarySidebar').onclick=glossaryModal;
 $('pauseSession').onclick=pauseReflection;$('resumeSession').onclick=()=>resumeReflection();
 $('reportBtn').onclick=showReport;$('reportSidebar').onclick=showReport;$('historyReport').onclick=showReport;
 $('chessPromptBtn').onclick=copyChessPrompt;$('finishBtn').onclick=finishReflection;$('gapSuggestionsBtn').onclick=showGapSuggestions;
 $('navigateBack').onclick=()=>navigate('back');$('navigateForward').onclick=()=>navigate('next');
 $('readerOpenToolbar').onclick=()=>showReader();$('readerOpenMap').onclick=()=>showReader();
 $('readerExit').onclick=()=>closeReader();$('readerEdit').onclick=()=>{const id=selectedId;closeReader();openNodeEditor(id);};
 $('readerBack').onclick=()=>readerMove('back');$('readerNext').onclick=()=>readerMove('next');
 $('readerChoices').onclick=e=>{const item=e.target.closest('[data-reader-route]');if(item)readerChoose(Number(item.dataset.readerRoute));};
 $('readerOverlay').addEventListener('pointerdown',e=>e.stopPropagation());
 $('readerOverlay').addEventListener('click',e=>e.stopPropagation());
 $('clearJourney').onclick=clearJourneyHighlight;$('jsonFileInput').onchange=e=>receiveImport(e.target.files?.[0]);
 $('newReflection').onclick=()=>editReflection();$('openDemo').onclick=()=>{const demo=app.reflections.find(r=>r.tags.includes('demonstração'));if(demo)return openReflection(demo.id);
 const r=makeDemo();app.reflections.unshift(r);persist();openReflection(r.id);};
 $('searchReflection').oninput=renderLibrary;$('libraryFilter').onchange=renderLibrary;
 $('reflectionGrid').onclick=e=>{const ref=e.target.closest('[data-ref]')?.dataset.ref;if(!ref){if(e.target.closest('[data-library-create]'))editReflection();return;}
 if(e.target.closest('[data-refmenu]')){document.querySelectorAll('.menu-dropdown').forEach(x=>{if(x.id!==`menu-${ref}`)x.classList.add('hidden');});$(`menu-${ref}`).classList.toggle('hidden');return;}
 const a=e.target.closest('[data-libaction]')?.dataset.libaction;if(a)return handleLibraryAction(a,ref);
 if(!e.target.closest('.menu-dropdown'))openReflection(ref);
 };
 $('reflectionSettings').onclick=()=>editReflection(activeId);$('exportBtn').onclick=exportModal;
 $('collapseSidebar').onclick=()=>{if(isMobile())$('sidebar').classList.add('mobile-hidden');else $('sidebar').classList.toggle('collapsed');};
 $('showSidebar').onclick=()=>$('sidebar').classList.toggle('mobile-hidden');
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>changeView(b.dataset.view);
 $('mapTab').onclick=()=>changeView('map');$('historyTab').onclick=()=>changeView('history');
 $('addRoot').onclick=()=>openNodeEditor();$('addToolbar').onclick=()=>openNodeEditor(null,selectedId?{parentId:selectedId,relation:'continua'}:{});
 $('emptyAdd').onclick=()=>openNodeEditor();$('historyAdd').onclick=()=>openNodeEditor();
 $('challengeSidebar').onclick=challenge;$('voicesBtn').onclick=editVoices;
 $('centerBtn').onclick=fitMap;$('fitMap').onclick=fitMap;$('focusRootBtn').onclick=()=>{const id=reflect()?.nodes.find(n=>n.type==='pergunta')?.id||reflect()?.nodes[0]?.id;if(id)focusNode(id);};
 $('layoutBtn').onclick=autoLayout;$('batchClassifyBtn').onclick=batchClassify;$('zoomIn').onclick=()=>setZoom(zoom*1.2);$('zoomOut').onclick=()=>setZoom(zoom/1.2);
 $('connectToolbar').onclick=()=>connectModal();$('emphasisToggle').onchange=e=>{showMainline=e.target.checked;renderEdges();};
 $('undoBtn').onclick=undoAction;$('redoBtn').onclick=redoAction;
 $('inspectorContent').onclick=e=>{const noteId=e.target.closest('[data-remove-note]')?.dataset.removeNote;if(noteId)return removeMarginNote(noteId);const discussionId=e.target.closest('[data-remove-discussion]')?.dataset.removeDiscussion;if(discussionId)return removeDiscussionMark(discussionId);const fallacyId=e.target.closest('[data-edit-fallacy]')?.dataset.editFallacy;if(fallacyId)return markFallacy(fallacyId);const q=e.target.closest('[data-quick]')?.dataset.quick;if(q)return quick(q);
 const action=e.target.closest('[data-inspector]')?.dataset.inspector;if(action==='read')showReader(selectedId);if(action==='edit')openNodeEditor(selectedId);if(action==='connect')connectModal();
 if(action==='challenge')challenge();if(action==='collapse')toggleCollapse(selectedId);if(action==='delete')removeNode();
 if(action==='discussion')markForDiscussion();if(action==='addNote')addMarginNote();if(action==='addFallacy')markFallacy();if(action==='dictionary')glossaryModal();if(action==='resumeFrom')resumeReflection(selectedId);};
 $('closeInspector').onclick=()=>{selectedId=null;renderWorkspace();};
 $('historyList').onclick=e=>{const jump=e.target.closest('[data-jump]')?.dataset.jump;if(jump)focusNode(jump);};
 $('closeModal').onclick=closeModal;$('modal').onclick=e=>{if(e.target===$('modal')||e.target.closest('[data-close-modal]'))closeModal();};
 document.addEventListener('keydown',e=>{
 if(readingMode){
  if(e.key==='Escape'){e.preventDefault();closeReader();return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();readerMove(e.key==='ArrowLeft'?'back':'next');return;}
  if(readerOptions.length&&/^[1-9]$/.test(e.key)){e.preventDefault();readerChoose(Number(e.key)-1);return;}
  // Não executar comandos de edição nem apagar blocos no modo de leitura.
  return;
 }
 if(e.key==='Escape'){if(!$('modal').classList.contains('hidden'))closeModal();else if(selectedId){selectedId=null;renderWorkspace();}else if(isMobile())$('sidebar').classList.add('mobile-hidden');return;}
 // Verifica o alvo real do evento: um input escondido da biblioteca não deve bloquear as setas no desktop.
 const target=e.target;
 const typing=target?.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"]');
 if(!$('modal').classList.contains('hidden')||typing||!activeId)return;
 if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();undoAction();}
 else if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){e.preventDefault();redoAction();}
 else if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();navigate(e.key==='ArrowLeft'?'back':'next');}
 else if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key==='Enter'&&selectedId&&e.target===$('graphViewport')){e.preventDefault();showReader(selectedId);}
 else if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key.toLowerCase()==='n'){e.preventDefault();openNodeEditor(null,selectedId?{parentId:selectedId}:{});}
 else if(['Delete','Backspace'].includes(e.key)&&selectedId){e.preventDefault();removeNode();}
 });
 window.addEventListener('resize',()=>{if(activeId&&view==='map')drawMini();});
 const activityEvents=['pointerdown','keydown','wheel'];for(const name of activityEvents)document.addEventListener(name,activity,{passive:true});
 trackingTimer=setInterval(()=>{if(tracker){trackTick();if(tracker)persist();}},15000);
 window.addEventListener('pagehide',stopTracking);
 window.addEventListener('focus',()=>{if(activeId)startTracking();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){stopTracking();if(saveTimer){clearTimeout(saveTimer);writeApp(app).catch(console.error);}}else if(activeId)startTracking();});
 wireGraph();
}
function applyTheme(){document.body.dataset.theme=app.settings.theme==='light'?'light':'dark';document.querySelector('meta[name="theme-color"]').content=app.settings.theme==='light'?'#f1f4fa':'#0b1220';}
async function boot(){try{app=await readApp();if(!app) {app=initialData();await writeApp(app);}if(!Array.isArray(app.reflections))throw Error('Dados locais inválidos.');app.settings||={theme:'dark'};app.reflections=normalizeImported({reflections:app.reflections});app.schemaVersion=4;}
 catch(e){console.error('Erro ao carregar',e);if(confirm('Não foi possível ler os dados locais. Deseja abrir com uma biblioteca temporária? Não será apagado nenhum backup externo.'))app=initialData();else {document.body.innerHTML='<main style="font:16px sans-serif;padding:32px">Não foi possível acessar o armazenamento local. Habilite IndexedDB no navegador e recarregue.</main>';return;}}
 applyTheme();wireEvents();renderLibrary();if(app.settings.lastSeenVersion!==APP_VERSION){toast(`CONTRAPONTO v${APP_VERSION}: nova apresentação guiada, tutorial e análise. Veja Novidades da versão.`,{duration:7000});}
 if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Offline indisponível:',err));
}
boot();
