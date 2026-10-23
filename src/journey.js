// Navegação e retomada: só usa ligações reais. Ciclos e relações "retorna" não travam a busca.
export function neighbours(r, id, direction='next') {
 const byId = new Map(r.nodes.map(n=>[n.id,n]));
 const edges = r.edges.filter(e=> direction==='next' ? e.source===id : e.target===id);
 return edges.filter(e=>byId.has(direction==='next'?e.target:e.source))
  .map(e=>({edge:e,node:byId.get(direction==='next'?e.target:e.source)}))
  .sort((a,b)=>String(a.node.createdAt).localeCompare(String(b.node.createdAt)));
}
export function pathTo(r,targetId){
 const ids=new Set(r.nodes.map(n=>n.id));if(!ids.has(targetId))return [];
 const starts=r.nodes.filter(n=>n.title==='Pergunta principal');
 const start=starts[0]?.id||r.nodes[0]?.id;
 if(!start)return [];const queue=[start],prev=new Map([[start,null]]),prevEdge=new Map();
 while(queue.length){const cur=queue.shift();if(cur===targetId)break;
  for(const e of r.edges.filter(e=>e.source===cur&&e.relation!=='retorna'&&ids.has(e.target))){
   if(prev.has(e.target))continue;prev.set(e.target,cur);prevEdge.set(e.target,e.id);queue.push(e.target);
  }
 }
 if(!prev.has(targetId))return [{id:targetId,edgeId:null}];
 const result=[];for(let id=targetId;id!=null;id=prev.get(id))result.push({id,edgeId:prevEdge.get(id)||null});
 return result.reverse();
}
export const elapsedMs=(a,b)=>{const x=Date.parse(a||''),y=Date.parse(b||'');return Number.isFinite(x)&&Number.isFinite(y)?Math.max(0,y-x):0;};
export function formatDuration(ms){let m=Math.floor(Math.max(0,ms||0)/60000);if(m===0)return '< 1 min';const d=Math.floor(m/1440);m%=1440;const h=Math.floor(m/60);m%=60;return [d?`${d}d`:null,h?`${h}h`:null,m?`${m}min`:null].filter(Boolean).join(' ');}
export function suspectedGaps(r,minMs=60*60000){
 const byId=new Map(r.nodes.map(n=>[n.id,n]));
 return r.edges.flatMap(e=>{
  const a=byId.get(e.source),b=byId.get(e.target);
  if(!a||!b||a.type==='pausa'||b.type==='pausa'||e.relation==='retorna')return [];
  const gap=elapsedMs(a.createdAt,b.createdAt);
  return gap>=minMs&&Date.parse(b.createdAt)>Date.parse(a.createdAt)?[{edgeId:e.id,source:a,target:b,gap}]:[];
 }).sort((a,b)=>b.gap-a.gap);
}
export function branchIdFor(r,nodeId){
 const root=r.nodes.find(n=>n.title==='Pergunta principal')||r.nodes[0];if(!root||root.id===nodeId)return null;
 const path=pathTo(r,nodeId);return path.length>1?path[1].id:nodeId;
}
export function pathRecap(r,nodeId,limit=7){
 const byId=new Map(r.nodes.map(n=>[n.id,n]));const voices=new Map(r.voices.map(v=>[v.id,v.name]));
 const path=pathTo(r,nodeId),last=path.slice(-limit);
 return {path,lines:last.map(step=>{const n=byId.get(step.id);return {id:n.id,voice:voices.get(n.voiceId)||'Sem voz',type:n.type,text:n.content||n.title};}),truncated:path.length>last.length};
}
