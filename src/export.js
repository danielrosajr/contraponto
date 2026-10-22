import {TYPES,RELATIONS,CLASSES,STATES,niceDate,cleanFilename} from './model.js';
export const escapeXml = v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function markdownFor(r){
 const voice=id=>r.voices.find(v=>v.id===id)?.name||'Sem voz';
 const lines=[`# ${r.title}`,`**Pergunta principal:** ${r.question}`,r.description?`**Descrição:** ${r.description}`:'',`**Estado:** ${r.status} | **Criada em:** ${niceDate(r.createdAt)} | **Atualizada:** ${niceDate(r.updatedAt)}`,
 '', '## Pensamentos (ordem de criação)'];
 const nodes=[...r.nodes].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i];const connections=r.edges.filter(e=>e.source===n.id);
  lines.push('',`### ${i+1}. ${n.title||TYPES[n.type]?.[0]||'Pensamento'} — ${TYPES[n.type]?.[0]||n.type}`,
   `- ID: ${n.id}`,`- Voz: ${voice(n.voiceId)}`,`- Classificação: ${CLASSES[n.classification]||'Não classificado'}`,`- Estado da ideia: ${STATES[n.state]||'Ativo'}`,`- Criado: ${niceDate(n.createdAt)}`,
   `- Conteúdo: ${n.content}`,n.notes?`- Observações: ${n.notes}`:'',
   ...(Array.isArray(n.annotations)?n.annotations.map(a=>`- Nota lateral (${niceDate(a.createdAt)}): ${a.text}`):[]),
   `- Ligações de saída: ${connections.length?connections.map(e=>`${RELATIONS[e.relation]||e.relation} → ${r.nodes.find(x=>x.id===e.target)?.title||r.nodes.find(x=>x.id===e.target)?.content.slice(0,55)||e.target} (${e.target})`).join(' | '):'Nenhuma'}`);
 }
 lines.push('','## Conexões detalhadas');for(const e of r.edges){const a=r.nodes.find(n=>n.id===e.source),b=r.nodes.find(n=>n.id===e.target);lines.push(`- **${a?.title||a?.content.slice(0,40)||e.source}** —${RELATIONS[e.relation]||e.relation}→ **${b?.title||b?.content.slice(0,40)||e.target}**`);}return lines.filter(x=>x!==undefined).join('\n');
}
export function promptFor(r){return `Você é um interlocutor crítico e respeitoso em uma análise de raciocínio pessoal. Examine o mapa de pensamentos a seguir. Não presuma que hipóteses são acontecimentos reais; sentimentos não são erros lógicos nem proposições factuais. Não faça interpretações clínicas ou diagnósticos. Não trate a conclusão como verdade obrigatória. Comentários, pausas, roteiros e metacomentários não são argumentos por si só; não os force a funcionar como premissas. Diferencie sofrimento sentido, efeitos concretos, julgamentos morais e consentimento, quando forem relevantes.\n\nPor favor, apresente: (1) resumo fiel; (2) premissas; (3) estrutura e solidez dos argumentos; (4) possíveis falácias, sem inventar falácias; (5) contradições reais versus aparentes; (6) suposições sem verificação; (7) conclusões que não decorrem das premissas; (8) mudanças de opinião; (9) perguntas ignoradas; (10) objeções pendentes; (11) interpretações alternativas; (12) uma reformulação mais rigorosa da conclusão. Cite IDs dos blocos quando pertinente. Respeite o contexto e pergunte quando faltar informação.\n\n--- INÍCIO DO MAPA ---\n${markdownFor(r)}\n--- FIM DO MAPA ---`}
export function downloadFile(filename,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);}
export const downloadText=(name,str,mime='text/plain;charset=utf-8')=>downloadFile(name,new Blob([str],{type:mime}));
function wrap(text,max=35,cap=8){const result=[];for(const paragraph of String(text||'').split('\n')){
 const words=paragraph.split(/\s+/).filter(Boolean);let line='';for(let word of words){while(word.length>max){if(line){result.push(line);line='';}result.push(word.slice(0,max));word=word.slice(max);}if(!word)continue;
 if((line+' '+word).trim().length>max){if(line)result.push(line);line=word;}else line=(line+' '+word).trim();}result.push(line||' ');if(result.length>cap)break;}
 return result.slice(0,cap);
}
export function makeSvg(r){
 if(!r.nodes.length){throw Error('Nenhum bloco para exportar.');}
 const margin=100,w=280;const layouts=r.nodes.map(n=>{const lines=wrap(n.content,37,9);const title=wrap(n.title||TYPES[n.type]?.[0]||'',33,2);
  return {n,lines,title,h:94+title.length*18+lines.length*19};});
 const minX=Math.min(...layouts.map(l=>l.n.x))-margin,minY=Math.min(...layouts.map(l=>l.n.y))-margin;
 const maxX=Math.max(...layouts.map(l=>l.n.x+w))+margin,maxY=Math.max(...layouts.map(l=>l.n.y+l.h))+margin;
 const width=Math.ceil(maxX-minX),height=Math.ceil(maxY-minY);
 if(width>22000||height>22000)throw Error('Mapa muito extenso para exportação em imagem. Reorganize os blocos.');
 const byId=new Map(layouts.map(l=>[l.n.id,l]));let parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`,
 `<defs><marker id="arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L11 6 L1 11 Z" fill="#7a94b6"/></marker></defs>`,
 `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#0b1221"/>`,
 `<text x="${minX+40}" y="${minY+50}" fill="#e8eefb" font-size="22" font-weight="bold" font-family="Arial,sans-serif">${escapeXml(r.title).slice(0,250)}</text>`];
 for(const e of r.edges){const a=byId.get(e.source),b=byId.get(e.target);if(!a||!b)continue;
 const sx=a.n.x+w,sy=a.n.y+a.h/2,tx=b.n.x,ty=b.n.y+b.h/2;
 const reverse=tx<sx+30;const x1=reverse?a.n.x+w/2:sx;const y1=reverse?a.n.y+a.h:sy;const x2=reverse?b.n.x+w/2:tx;const y2=reverse?b.n.y:ty;
 const dx=Math.max(70,Math.abs(x2-x1)*.45),d=reverse?`M${x1},${y1} C${x1+75},${y1+90} ${x2-75},${y2-90} ${x2},${y2}`:`M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
 parts.push(`<path d="${d}" fill="none" stroke="${e.relation==='contesta'?'#db8a85':'#7a94b6'}" stroke-width="2.3" marker-end="url(#arrow)"/>`);
 const mx=(x1+x2)/2,my=(y1+y2)/2-8;parts.push(`<rect x="${mx-42}" y="${my-16}" width="84" height="20" rx="10" fill="#18263c"/><text x="${mx}" y="${my-2}" text-anchor="middle" font-size="10" fill="#cfddf1" font-family="Arial,sans-serif">${escapeXml(RELATIONS[e.relation]||e.relation)}</text>`);
 }
 for(const l of layouts){const {n,h,lines,title}=l,c=TYPES[n.type]?.[2]||'#91a8c5',voice=r.voices.find(v=>v.id===n.voiceId)?.name||'Sem voz';
 parts.push(`<rect x="${n.x}" y="${n.y}" width="${w}" height="${h}" rx="16" fill="#182337" stroke="${c}" stroke-width="2"/>`,
 `<rect x="${n.x+1}" y="${n.y+1}" width="${w-2}" height="7" rx="3" fill="${c}"/>`,
 `<text x="${n.x+15}" y="${n.y+30}" fill="${c}" font-size="11" font-family="Arial,sans-serif" font-weight="bold">${escapeXml(TYPES[n.type]?.[0]||n.type).toUpperCase()}</text>`);
 let y=n.y+52;for(const t of title){parts.push(`<text x="${n.x+15}" y="${y}" fill="#f3f6fd" font-size="15" font-weight="bold" font-family="Arial,sans-serif">${escapeXml(t)}</text>`);y+=18;}
 y+=7;for(const t of lines){parts.push(`<text x="${n.x+15}" y="${y}" fill="#d8e0ef" font-size="13" font-family="Arial,sans-serif">${escapeXml(t)}</text>`);y+=19;}
 parts.push(`<text x="${n.x+15}" y="${n.y+h-15}" fill="#aabbd7" font-size="11" font-family="Arial,sans-serif">${escapeXml(voice)} • ${escapeXml(STATES[n.state]||'Ativo')}${n.annotations?.length?' • '+n.annotations.length+' nota(s)':''}</text>`);}
 parts.push('</svg>');return {svg:parts.join(''),width,height};
}
export async function downloadSvgOrPng(r,format){const {svg,width,height}=makeSvg(r),base=cleanFilename(r.title);
 if(format==='svg'){downloadText(`${base}.svg`,svg,'image/svg+xml;charset=utf-8');return;}
 const max=8000;const scale=Math.min(2,max/Math.max(width,height),Math.sqrt(30000000/(width*height)));const can=document.createElement('canvas');can.width=Math.max(1,Math.floor(width*scale));can.height=Math.max(1,Math.floor(height*scale));
 const img=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
 try{await new Promise((ok,fail)=>{img.onload=ok;img.onerror=()=>fail(Error('Falha ao converter SVG em PNG.'));img.src=url;});
 const ctx=can.getContext('2d');ctx.drawImage(img,0,0,can.width,can.height);const blob=await new Promise((ok,fail)=>can.toBlob(b=>b?ok(b):fail(Error('PNG indisponível neste navegador.')),'image/png'));downloadFile(`${base}.png`,blob);
 }finally{URL.revokeObjectURL(url);}}
