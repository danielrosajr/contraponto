import {TYPES,RELATIONS,CLASSES,STATES,PROMPTS,uid,now,initialData,makeDemo,newReflection,safeText,niceDate,normalizeImported,cleanFilename} from './model.js';
import {readApp,writeApp} from './storage.js';
import {markdownFor,promptFor,downloadText,downloadSvgOrPng} from './export.js';

const $=id=>document.getElementById(id);
let app, activeId=null, selectedId=null, view='map', pan={x:100,y:100},zoom=1, visible=new Set(), showMainline=true;
let undo=[],redo=[],saveTimer=null,toastTimer=null,modalCleanup=null,miniExtent=null,edgeFocusId=null;
const isMobile=()=>innerWidth<=800;
const reflect=()=>app.reflections.find(r=>r.id===activeId);
const node=id=>reflect()?.nodes.find(n=>n.id===id);
const voice=id=>reflect()?.voices.find(v=>v.id===id);
const labelOf=n=>n.title||n.content.slice(0,55)||TYPES[n.type]?.[0]||'Pensamento';
const clone=o=>JSON.parse(JSON.stringify(o));
const options=(entries,chosen)=>entries.map(([k,v])=>`<option value="${safeText(k)}" ${k===chosen?'selected':''}>${safeText(v)}</option>`).join('');
const typeOptions=chosen=>options(Object.entries(TYPES).map(([id,t])=>[id,t[0]]),chosen);
const relationOptions=chosen=>options(Object.entries(RELATIONS),chosen);
const voiceOptions=chosen=>options(reflect().voices.map(v=>[v.id,v.name]),chosen);

function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3100);}
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

function openModal(title,html,setup){closeModal();$('modalTitle').textContent=title;$('modalContent').innerHTML=`<div class="modal-body">${html}</div>`;$('modal').classList.remove('hidden');if(setup)modalCleanup=setup($('modalContent'))||null;
 requestAnimationFrame(()=> $('modalContent').querySelector('[autofocus]')?.focus());}
function closeModal(){modalCleanup?.();modalCleanup=null;$('modal').classList.add('hidden');$('modalContent').innerHTML='';}
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
function goHome(){activeId=null;selectedId=null;closeModal();undo=[];redo=[];$('sidebar').classList.remove('collapsed');$('sidebar').classList.toggle('mobile-hidden',isMobile());renderLibrary();}
function openReflection(id){const r=app.reflections.find(r=>r.id===id);if(!r)return;closeModal();activeId=id;selectedId=null;undo=[];redo=[];view='map';pan={x:50,y:50};zoom=1;
 $('library').classList.add('hidden');$('workspace').classList.remove('hidden');$('sidebar').classList.toggle('mobile-hidden',isMobile());$('sidebar').classList.remove('collapsed');renderWorkspace();requestAnimationFrame(()=>fitMap());}
function editReflection(id){const r=id?app.reflections.find(x=>x.id===id):null;
 formModal(r?'Editar reflexão':'Nova reflexão',`${field('title','Título',r?.title||'','input',true,'autofocus maxlength="250"')}${field('question','Pergunta principal',r?.question||'','textarea',true,'maxlength="10000"')}${field('description','Descrição (opcional)',r?.description||'','textarea',false,'maxlength="20000"')}${field('tags','Etiquetas separadas por vírgula',r?.tags.join(', ')||'')}${r?selectField('status','Situação',[['em andamento','Em andamento'],['pausado','Pausado'],['concluído','Concluído']],r.status):''}`,
 r?'Salvar alterações':'Criar reflexão',data=>{const title=data.get('title').trim(),question=data.get('question').trim();if(!title||!question)return toast('Informe título e pergunta principal.'),false;
 const tags=data.get('tags').split(',').map(x=>x.trim()).filter(Boolean).slice(0,20);
 if(r){if(activeId===r.id)checkpoint();r.title=title;r.question=question;r.description=data.get('description').trim();r.tags=tags;r.status=data.get('status');r.updatedAt=now();persist();if(activeId===r.id)renderWorkspace();else renderLibrary();}
 else {const created=newReflection(title,question,data.get('description'),tags);app.reflections.push(created);persist();openReflection(created.id);}return true;});}
function handleLibraryAction(action,id){const r=app.reflections.find(x=>x.id===id);if(!r)return;
 if(action==='open')return openReflection(id);if(action==='edit')return editReflection(id);
 if(action==='duplicate'){const c=clone(r),map=new Map();c.id=uid('reflection');c.title=`${r.title} (cópia)`;c.createdAt=now();c.updatedAt=now();c.archived=false;c.nodes.forEach(n=>{const old=n.id;n.id=uid('node');map.set(old,n.id);});c.edges.forEach(e=>{e.id=uid('edge');e.source=map.get(e.source);e.target=map.get(e.target);});app.reflections.push(c);persist();renderLibrary();toast('Reflexão duplicada.');}
 if(action==='archive'){r.archived=!r.archived;r.updatedAt=now();persist();renderLibrary();toast(r.archived?'Reflexão arquivada.':'Reflexão restaurada.');}
 if(action==='delete'){if(!confirm(`Excluir definitivamente “${r.title}” e todos os blocos?\n\nA ação não pode ser desfeita.`))return;app.reflections=app.reflections.filter(x=>x.id!==id);persist();renderLibrary();toast('Reflexão excluída.');}}

function renderWorkspace(){const r=reflect();if(!r)return;
 $('currentTitle').textContent=r.title;$('currentQuestion').textContent=r.question;
 for(const el of document.querySelectorAll('[data-view]'))el.classList.toggle('active',el.dataset.view===view);
 $('mapTab').classList.toggle('active',view==='map');$('historyTab').classList.toggle('active',view==='history');
 $('graphPanel').classList.toggle('hidden',view!=='map');$('historyPanel').classList.toggle('hidden',view!=='history');
 $('undoBtn').disabled=!undo.length;$('redoBtn').disabled=!redo.length;
 $('inspector').classList.toggle('hidden',!selectedId||view!=='map');
 if(view==='map'){renderGraph();renderInspector();}else renderHistory();
}
function changeView(v){view=v;if(v==='history'&&isMobile())$('sidebar').classList.add('mobile-hidden');renderWorkspace();}
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
 return `<div class="thought-node ${selectedId===n.id?'selected':''} ${n.state==='abandonado'?'inactive':''}" data-node="${safeText(n.id)}" style="left:${n.x}px;top:${n.y}px;--node-color:${t[2]}"><div class="node-inner"><div class="node-label"><span>${safeText(t[1])} ${safeText(t[0])}</span>${childCount?`<span class="collapse-indicator" title="Clique duas vezes no indicador para recolher ou expandir">${n.collapsed?'▸':'▾'} ${childCount}</span>`:''}</div><div class="node-title">${safeText(n.title||t[0])}</div><div class="node-content">${safeText(n.content)}</div><div class="node-footer"><span class="voice-chip"><i class="voice-dot" style="--voice-color:${safeText(v?.color||'#90a6c1')}"></i>${safeText(v?.name||'Sem voz')}</span><span>${safeText(STATES[n.state]||'Ativo')}</span></div></div></div>`;
 }).join('');
 for(const el of $('graphNodes').children)nodeHeights.set(el.dataset.node,el.offsetHeight);
 renderEdges();updateTransform();drawMini();$('selectionHint').textContent=selectedId?'Arraste o cabeçalho do bloco para reposicioná-lo.':'Escolha um pensamento para continuar seu raciocínio.';
}
function edgeGeometry(a,b){let x1=a.x+280,y1=a.y+nodeMetrics(a.id).h/2,x2=b.x,y2=b.y+nodeMetrics(b.id).h/2;
 if(x2>=x1-15){const d=Math.max(65,Math.abs(x2-x1)*.48);return {d:`M${x1} ${y1} C${x1+d} ${y1} ${x2-d} ${y2} ${x2} ${y2}`,mx:(x1+x2)/2,my:(y1+y2)/2-9};}
 x1=a.x+140;y1=a.y+nodeMetrics(a.id).h;x2=b.x+140;y2=b.y;
 return {d:`M${x1} ${y1} C${x1+72} ${y1+95} ${x2-72} ${y2-95} ${x2} ${y2}`,mx:(x1+x2)/2,my:(y1+y2)/2-5};
}
function renderEdges(){const r=reflect();if(!r)return;
 $('graphEdges').innerHTML=`<defs><marker id="edgeArrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L11 6L1 11Z" fill="#8a9fc1"/></marker></defs>`+r.edges.filter(e=>visible.has(e.source)&&visible.has(e.target)).map(e=>{
 const a=node(e.source),b=node(e.target);if(!a||!b)return '';const g=edgeGeometry(a,b),main=showMainline&&['continua','reformula','retorna'].includes(e.relation),label=RELATIONS[e.relation]||e.relation;
 return `<g><path class="edge-visible ${main?'mainline':''} ${e.relation==='contesta'?'contest':''}" d="${g.d}"/><path class="edge-hit" d="${g.d}" data-edge="${safeText(e.id)}"/><text class="edge-label" text-anchor="middle" x="${g.mx}" y="${g.my}">${safeText(label)}</text></g>`;}).join('');
}
function updateTransform(){ $('graphStage').style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;$('zoomLabel').textContent=`${Math.round(zoom*100)}%`;}
function canvasSize(){return {width:$('graphViewport').clientWidth,height:$('graphViewport').clientHeight};}
function fitMap(){const r=reflect();if(!r||view!=='map')return;const nodes=r.nodes.filter(n=>visible.has(n.id));if(!nodes.length)return;
 const left=Math.min(...nodes.map(n=>n.x))-65,right=Math.max(...nodes.map(n=>n.x+280))+65,top=Math.min(...nodes.map(n=>n.y))-60,bottom=Math.max(...nodes.map(n=>n.y+nodeMetrics(n.id).h))+60;
 const {width,height}=canvasSize();if(!width||!height)return;zoom=Math.min(1.12,Math.max(.22,Math.min(width/(right-left),height/(bottom-top))));pan={x:(width-(left+right)*zoom)/2,y:(height-(top+bottom)*zoom)/2};updateTransform();drawMini();}
function focusNode(id){const n=node(id);if(!n)return;changeView('map');if(!visible.has(id)){for(const other of reflect().nodes)other.collapsed=false;renderGraph();}
 selectedId=id;const {width,height}=canvasSize();pan={x:width/2-(n.x+140)*zoom,y:height/2-(n.y+nodeMetrics(id).h/2)*zoom};renderWorkspace();if(isMobile())$('inspector').classList.add('hidden');updateTransform();drawMini();}
function setZoom(z,cx,cy){const {width,height}=canvasSize();cx??=width/2;cy??=height/2;const currentX=(cx-pan.x)/zoom,currentY=(cy-pan.y)/zoom;zoom=Math.min(2.5,Math.max(.2,z));pan.x=cx-currentX*zoom;pan.y=cy-currentY*zoom;updateTransform();drawMini();}
function drawMini(){const r=reflect();if(!r||!r.nodes.length)return;const nodes=r.nodes.filter(n=>visible.has(n.id));if(!nodes.length)return;
 const left=Math.min(...nodes.map(n=>n.x))-140,top=Math.min(...nodes.map(n=>n.y))-120,right=Math.max(...nodes.map(n=>n.x+280))+140,bottom=Math.max(...nodes.map(n=>n.y+nodeMetrics(n.id).h))+120;
 miniExtent={left,top,right,bottom};const width=right-left,height=bottom-top;const X=x=>((x-left)/width*200),Y=y=>((y-top)/height*100);
 const {width:vw,height:vh}=canvasSize();const visleft=(0-pan.x)/zoom,vistop=(0-pan.y)/zoom,visright=(vw-pan.x)/zoom,visbottom=(vh-pan.y)/zoom;
 $('miniMapSvg').innerHTML=nodes.map(n=>`<rect x="${X(n.x)}" y="${Y(n.y)}" width="${Math.max(3,280/width*200)}" height="${Math.max(2,nodeMetrics(n.id).h/height*100)}" rx="2" fill="${TYPES[n.type]?.[2]||'#8a9fc1'}" opacity=".8"/>`).join('')+`<rect x="${X(visleft)}" y="${Y(vistop)}" width="${(visright-visleft)/width*200}" height="${(visbottom-vistop)/height*100}" stroke="#fff" stroke-width="1.6" fill="#9bb6ff18"/>`;
}
function selectNode(id){selectedId=id;for(const el of $('graphNodes').children)el.classList.toggle('selected',el.dataset.node===id);renderInspector();$('inspector').classList.toggle('hidden',!selectedId||view!=='map');}
function renderInspector(){const r=reflect(),n=node(selectedId);if(!r||!n)return;
 const t=TYPES[n.type],v=voice(n.voiceId),incomings=r.edges.filter(e=>e.target===n.id),outgoings=r.edges.filter(e=>e.source===n.id);
 $('inspectorContent').innerHTML=`<div class="inspector-body"><div class="info-line" style="color:${t[2]}">${safeText(t[1])} ${safeText(t[0])}</div><h2>${safeText(n.title||t[0])}</h2><div class="content-paragraph">${safeText(n.content)}</div>${n.notes?`<p class="small-note"><b>Observações:</b> ${safeText(n.notes)}</p>`:''}<div class="inline-metas"><span class="tag">${safeText(v?.name||'Sem voz')}</span><span class="tag">${safeText(CLASSES[n.classification]||'Não classificado')}</span><span class="tag">${safeText(STATES[n.state]||'Ativo')}</span></div>
 <div class="inspector-footer"><button class="secondary small" data-inspector="edit">✎ Editar bloco</button><button class="secondary small" data-inspector="connect">⤳ Conectar</button><button class="secondary small" data-inspector="collapse">${n.collapsed?'▸ Expandir':'▾ Recolher'}</button></div>
 <div class="section-title">CONTINUAR A PARTIR DAQUI</div><div class="action-grid">
 ${[['continue','↗ Continuar'],['question','? Questionar'],['object','! Objetar'],['respond','↩ Responder'],['example','▦ Exemplo'],['scenario','◇ Cenário'],['emotion','♡ Emoção'],['conclude','◉ Concluir'],['branch','⑂ Ramificação'],['return','↶ Retornar']].map(([a,l])=>`<button data-quick="${a}">${l}</button>`).join('')}</div>
 <div class="section-title">CONEXÕES (${incomings.length} entrada(s), ${outgoings.length} saída(s))</div><div class="small-note">${outgoings.map(e=>`<div style="margin-bottom:8px">${safeText(RELATIONS[e.relation])} → ${safeText(labelOf(node(e.target)||{title:'Bloco ausente'}))}</div>`).join('')||'Nenhuma conexão de saída.'}</div>
 <div class="inspector-footer"><button class="secondary small" data-inspector="challenge">✦ Desafiar pensamento</button><button class="secondary small danger-outline" data-inspector="delete">✕ Excluir</button></div></div>`;
}
function renderHistory(){const r=reflect();if(!r)return;const arr=[...r.nodes].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
 $('historyList').innerHTML=arr.length?arr.map((n,i)=>{const v=voice(n.voiceId),links=r.edges.filter(e=>e.source===n.id);
 return `<article class="history-item"><div class="meta">${i+1} · ${niceDate(n.createdAt)} · ${safeText(TYPES[n.type]?.[0]||n.type)} · ${safeText(v?.name||'Sem voz')} · ${safeText(STATES[n.state])}</div><h3>${safeText(labelOf(n))}</h3><p>${safeText(n.content)}</p>${n.notes?`<p><i>Observações: ${safeText(n.notes)}</i></p>`:''}<div class="links">${links.map(e=>`${safeText(RELATIONS[e.relation])} → ${safeText(labelOf(node(e.target)||{title:'Bloco ausente'}))}`).join(' · ')||'Nenhuma saída'}</div><button data-jump="${safeText(n.id)}">Ver no mapa →</button></article>`;}).join(''):'<p>Histórico vazio. Crie o primeiro pensamento.</p>';
}
function nextPosition(from){const r=reflect();if(!from){const {width,height}=canvasSize();let x=(width/2-pan.x)/zoom-140,y=(height/2-pan.y)/zoom-100;
 while(r.nodes.some(n=>Math.abs(n.x-x)<210&&Math.abs(n.y-y)<160)){y+=230;}return {x:Math.round(x),y:Math.round(y)};}
 const others=r.edges.filter(e=>e.source===from.id&&e.relation!=='retorna');let x=from.x+355,y=from.y+(others.length?others.length*240-120:0);
 while(r.nodes.some(n=>Math.abs(n.x-x)<240&&Math.abs(n.y-y)<165)){y+=235;}return {x,y};}
function openNodeEditor(existingId=null,config={}){const r=reflect();if(!r)return;const existing=existingId?node(existingId):null,parent=config.parentId?node(config.parentId):null;
 const defaults={type:config.type||'premissa',title:config.title||'',content:config.content||'',notes:'',classification:'',state:'ativo',voiceId:config.voiceId||parent?.voiceId||r.voices[0]?.id};
 const n=existing||defaults;
 const label=existing?'Editar pensamento':parent?'Continuar raciocínio':'Novo pensamento';
 const voiceField=selectField('voiceId','Voz interna',r.voices.map(v=>[v.id,v.name]),n.voiceId);
 formModal(label,`<div class="form-grid">${selectField('type','Tipo de bloco',Object.entries(TYPES).map(([k,t])=>[k,t[0]]),n.type)}${voiceField}</div>
 ${field('title','Título breve (opcional)',n.title||'','input',false,'maxlength="250"')}${field('content','Seu pensamento',n.content||'','textarea',true,'autofocus maxlength="30000" rows="5"')}
 <div class="form-grid">${selectField('classification','Natureza da afirmação',Object.entries(CLASSES),n.classification)}${selectField('state','Estado do pensamento',Object.entries(STATES),n.state)}</div>
 ${parent&&!existing?selectField('relation','Esta ideia se conecta como',Object.entries(RELATIONS),config.relation||'continua'):''}
 ${field('notes','Observações e contexto (opcional)',n.notes||'','textarea',false,'maxlength="30000" rows="2"')}
 <div class="field-hint">Dica: hipóteses, opiniões e emoções podem conviver no mesmo mapa sem serem tratadas como fatos.</div>`,existing?'Salvar alterações':'Adicionar ao mapa',data=>{
 const content=data.get('content').trim();if(!content)return toast('Escreva o pensamento antes de salvar.'),false;
 const ts=now();let id=existingId;
 mutation(()=>{if(existing){Object.assign(existing,{type:data.get('type'),voiceId:data.get('voiceId'),title:data.get('title').trim(),content,classification:data.get('classification'),state:data.get('state'),notes:data.get('notes').trim(),updatedAt:ts});}
 else {id=uid('node');const pos=nextPosition(parent);r.nodes.push({id,x:pos.x,y:pos.y,type:data.get('type'),voiceId:data.get('voiceId'),title:data.get('title').trim(),content,notes:data.get('notes').trim(),classification:data.get('classification'),state:data.get('state'),collapsed:false,createdAt:ts,updatedAt:ts});
 if(parent)r.edges.push({id:uid('edge'),source:parent.id,target:id,relation:data.get('relation')||config.relation||'continua',createdAt:ts});
 if(config.returnToRoot&&r.nodes[0]?.id!==id)r.edges.push({id:uid('edge'),source:id,target:r.nodes[0].id,relation:'retorna',createdAt:ts});}
 });
 selectNode(id);if(isMobile())$('inspector').classList.add('hidden');toast(existing?'Pensamento atualizado.':'Pensamento adicionado.');return true;
 });}
const QUICK = {
 continue: n=>({type:n.type==='pergunta'?'premissa':'argumento',relation:'continua'}),question:()=>({type:'pergunta',relation:'continua'}),
 object:()=>({type:'objecao',relation:'contesta',voiceId:'eu2'}),respond:()=>({type:'contra',relation:'contesta'}),
 example:()=>({type:'exemplo',relation:'exemplifica'}),scenario:()=>({type:'cenario',relation:'continua'}),
 emotion:()=>({type:'emocao',relation:'continua',classification:'sentimento'}),conclude:()=>({type:'provisoria',relation:'reformula'}),
 branch:()=>({type:'pergunta',title:'Nova ramificação',relation:'continua'}),return:()=>({type:'retorno',title:'Retorno ao tema',relation:'continua',returnToRoot:true})};
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
function exportModal(){if(!reflect())return;const opts=[['md','☷','Texto estruturado (.md)','Argumentos, vozes, conexões e ordem cronológica'],['svg','◇','Mapa em SVG','Imagem vetorial do mapa inteiro, sem cortes'],['png','▧','Mapa em PNG','Imagem PNG com todos os blocos e conexões'],['json','{}','Backup completo (.json)','Dados, posições, vozes e configurações da biblioteca'],['ai','✦','Prompt para inteligência artificial','Copiar perguntas de análise crítica com o mapa completo']];
 openModal('Exportar reflexão',`<p class="small-note">Apenas quando você escolher exportar ou copiar haverá uma cópia dos dados fora do armazenamento local.</p>${opts.map(([a,ic,name,desc])=>`<button class="export-option" data-export="${a}"><span class="symbol">${ic}</span><span><b>${name}</b><small>${desc}</small></span></button>`).join('')}`,el=>el.querySelectorAll('[data-export]').forEach(b=>b.onclick=async()=>{
 const type=b.dataset.export,r=reflect();try{
 if(type==='md')downloadText(`${cleanFilename(r.title)}.md`,markdownFor(r),'text/markdown;charset=utf-8');
 else if(type==='svg'||type==='png')await downloadSvgOrPng(r,type);
 else if(type==='json')downloadText(`contraponto-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(app,null,2),'application/json;charset=utf-8');
 else if(type==='ai'){await copyText(promptFor(r));toast('Prompt e raciocínio copiados. Cole onde desejar.');closeModal();return;}
 toast('Exportação iniciada.');closeModal();}catch(err){console.error(err);toast(err.message||'Não foi possível exportar.');}
 }));}
async function copyText(str){if(navigator.clipboard&&isSecureContext)return navigator.clipboard.writeText(str);
 const t=document.createElement('textarea');t.value=str;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('Não foi possível copiar automaticamente. Use o navegador em HTTPS ou localhost.');}
function importJson(){ $('jsonFileInput').value='';$('jsonFileInput').click();}
async function receiveImport(file){if(!file)return;if(file.size>15*1024*1024)return toast('Arquivo maior que 15 MB.');let refs,importedSettings=null;
 try{const raw=JSON.parse(await file.text());refs=normalizeImported(raw);if(raw.settings&&typeof raw.settings==='object')importedSettings={theme:raw.settings.theme==='light'?'light':'dark'};}catch(e){console.error(e);return toast(e.message||'JSON inválido.');}
 openModal('Importar backup',`<p>Encontradas <b>${refs.length}</b> reflexões no arquivo.</p><p class="small-note">Ao adicionar, as reflexões existentes são preservadas. Ao substituir, a biblioteca atual será apagada e receberá o conteúdo importado.</p><div class="modal-actions"><button class="secondary" data-close-modal>Cancelar</button><button class="secondary" id="importReplace">Substituir biblioteca</button><button class="primary" id="importAppend">Adicionar reflexões</button></div>`,el=>{
 el.querySelector('#importReplace').onclick=()=>{if(!confirm('Substituir TODA a biblioteca local por este backup? Isso não pode ser desfeito sem outro backup.'))return;
 app.reflections=refs;if(importedSettings){app.settings=importedSettings;applyTheme();}activeId=null;selectedId=null;closeModal();persist();renderLibrary();toast('Biblioteca restaurada.');};
 el.querySelector('#importAppend').onclick=()=>{
 const imported=clone(refs),exists=new Set(app.reflections.map(r=>r.id));for(const r of imported){if(exists.has(r.id)){r.id=uid('reflection');}exists.add(r.id);}
 app.reflections.push(...imported);activeId=null;selectedId=null;closeModal();persist();renderLibrary();toast(`${imported.length} reflexão(ões) importada(s).`);};
 });}

let graphDrag=null,panDrag=null;
function wireGraph(){const viewport=$('graphViewport'),nodes=$('graphNodes'),edges=$('graphEdges');
 nodes.addEventListener('pointerdown',e=>{
 const element=e.target.closest('[data-node]');if(!element||e.button>0)return;
 e.stopPropagation();if(e.pointerType==='touch')e.preventDefault();const id=element.dataset.node,n=node(id);if(!n)return;
 selectNode(id);graphDrag={id,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,origX:n.x,origY:n.y,old:clone(reflect()),moved:false};
 element.setPointerCapture(e.pointerId);
 });
 nodes.addEventListener('pointermove',e=>{if(!graphDrag||e.pointerId!==graphDrag.pointer)return;const n=node(graphDrag.id),el=nodes.querySelector(`[data-node="${CSS.escape(graphDrag.id)}"]`);if(!n||!el)return;
 const dx=(e.clientX-graphDrag.startX)/zoom,dy=(e.clientY-graphDrag.startY)/zoom;if(Math.abs(dx)<3&&Math.abs(dy)<3&&!graphDrag.moved)return;
 graphDrag.moved=true;n.x=Math.round(graphDrag.origX+dx);n.y=Math.round(graphDrag.origY+dy);el.style.left=n.x+'px';el.style.top=n.y+'px';renderEdges();drawMini();});
 const endDrag=e=>{if(!graphDrag||e.pointerId!==graphDrag.pointer)return;if(graphDrag.moved){pushCheckpoint(graphDrag.old);reflect().updatedAt=now();persist();renderWorkspace();}graphDrag=null;};
 nodes.addEventListener('pointerup',endDrag);nodes.addEventListener('pointercancel',endDrag);
 nodes.addEventListener('dblclick',e=>{const el=e.target.closest('[data-node]');if(!el)return;if(e.target.closest('.collapse-indicator'))return toggleCollapse(el.dataset.node);openNodeEditor(el.dataset.node);});
 edges.addEventListener('click',e=>{const id=e.target.dataset.edge;if(id){e.stopPropagation();editEdge(id);}});
 viewport.addEventListener('pointerdown',e=>{if(e.button>0||e.target.closest('.thought-node')||e.target.closest('.edge-hit'))return;
 panDrag={pointer:e.pointerId,startX:e.clientX,startY:e.clientY,origX:pan.x,origY:pan.y};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');if(selectedId){selectedId=null;renderGraph();$('inspector').classList.add('hidden');}});
 viewport.addEventListener('pointermove',e=>{if(!panDrag||e.pointerId!==panDrag.pointer)return;pan.x=panDrag.origX+(e.clientX-panDrag.startX);pan.y=panDrag.origY+(e.clientY-panDrag.startY);updateTransform();drawMini();});
 const endPan=e=>{if(panDrag?.pointer===e.pointerId){panDrag=null;viewport.classList.remove('panning');}};
 viewport.addEventListener('pointerup',endPan);viewport.addEventListener('pointercancel',endPan);
 viewport.addEventListener('wheel',e=>{e.preventDefault();const rect=viewport.getBoundingClientRect();setZoom(zoom*Math.exp(-e.deltaY*.0013),e.clientX-rect.left,e.clientY-rect.top);},{passive:false});
 $('miniMap').addEventListener('click',e=>{if(!miniExtent)return;const rect=$('miniMapSvg').getBoundingClientRect();const x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));
 const worldX=miniExtent.left+x*(miniExtent.right-miniExtent.left),worldY=miniExtent.top+y*(miniExtent.bottom-miniExtent.top);const size=canvasSize();pan.x=size.width/2-worldX*zoom;pan.y=size.height/2-worldY*zoom;updateTransform();drawMini();});
}
function wireEvents(){
 $('brandBtn').onclick=goHome;$('backHome').onclick=goHome;$('themeBtn').onclick=()=>{app.settings.theme=app.settings.theme==='dark'?'light':'dark';applyTheme();persist();};
 $('globalImport').onclick=importJson;$('jsonFileInput').onchange=e=>receiveImport(e.target.files?.[0]);
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
 $('addRoot').onclick=()=>openNodeEditor();$('addToolbar').onclick=()=>openNodeEditor(null,selectedId?{parentId:selectedId,type:'argumento',relation:'continua'}:{});
 $('emptyAdd').onclick=()=>openNodeEditor();$('historyAdd').onclick=()=>openNodeEditor();
 $('challengeSidebar').onclick=challenge;$('voicesBtn').onclick=editVoices;
 $('centerBtn').onclick=fitMap;$('fitMap').onclick=fitMap;$('focusRootBtn').onclick=()=>{const id=reflect()?.nodes.find(n=>n.type==='pergunta')?.id||reflect()?.nodes[0]?.id;if(id)focusNode(id);};
 $('layoutBtn').onclick=autoLayout;$('zoomIn').onclick=()=>setZoom(zoom*1.2);$('zoomOut').onclick=()=>setZoom(zoom/1.2);
 $('connectToolbar').onclick=()=>connectModal();$('emphasisToggle').onchange=e=>{showMainline=e.target.checked;renderEdges();};
 $('undoBtn').onclick=undoAction;$('redoBtn').onclick=redoAction;
 $('inspectorContent').onclick=e=>{const q=e.target.closest('[data-quick]')?.dataset.quick;if(q)return quick(q);
 const action=e.target.closest('[data-inspector]')?.dataset.inspector;if(action==='edit')openNodeEditor(selectedId);if(action==='connect')connectModal();
 if(action==='challenge')challenge();if(action==='collapse')toggleCollapse(selectedId);if(action==='delete')removeNode();};
 $('closeInspector').onclick=()=>{selectedId=null;renderWorkspace();};
 $('historyList').onclick=e=>{const jump=e.target.closest('[data-jump]')?.dataset.jump;if(jump)focusNode(jump);};
 $('closeModal').onclick=closeModal;$('modal').onclick=e=>{if(e.target===$('modal')||e.target.closest('[data-close-modal]'))closeModal();};
 document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(!$('modal').classList.contains('hidden'))closeModal();else if(selectedId){selectedId=null;renderWorkspace();}else if(isMobile())$('sidebar').classList.add('mobile-hidden');return;}
 if(!$('modal').classList.contains('hidden')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||!activeId)return;
 if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();undoAction();}
 else if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){e.preventDefault();redoAction();}
 else if(!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key.toLowerCase()==='n'){e.preventDefault();openNodeEditor(null,selectedId?{parentId:selectedId,type:'argumento'}:{});}
 else if(['Delete','Backspace'].includes(e.key)&&selectedId){e.preventDefault();removeNode();}
 });
 window.addEventListener('resize',()=>{if(activeId&&view==='map')drawMini();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&saveTimer){clearTimeout(saveTimer);writeApp(app).catch(console.error);}});
 wireGraph();
}
function applyTheme(){document.body.dataset.theme=app.settings.theme==='light'?'light':'dark';document.querySelector('meta[name="theme-color"]').content=app.settings.theme==='light'?'#f1f4fa':'#0b1220';}
async function boot(){try{app=await readApp();if(!app) {app=initialData();await writeApp(app);}if(!Array.isArray(app.reflections))throw Error('Dados locais inválidos.');app.settings||={theme:'dark'};app.reflections=normalizeImported({reflections:app.reflections});}
 catch(e){console.error('Erro ao carregar',e);if(confirm('Não foi possível ler os dados locais. Deseja abrir com uma biblioteca temporária? Não será apagado nenhum backup externo.'))app=initialData();else {document.body.innerHTML='<main style="font:16px sans-serif;padding:32px">Não foi possível acessar o armazenamento local. Habilite IndexedDB no navegador e recarregue.</main>';return;}}
 applyTheme();wireEvents();renderLibrary();
 if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Offline indisponível:',err));
}
boot();
