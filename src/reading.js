import {neighbours} from './journey.js';

// Escolhe apenas uma ligação real. Se há mais de uma, solicita escolha humana.
// O histórico preserva a volta ao percurso percorrido, inclusive com ciclos.
export function readingStep(r, selectedId, direction, history=[]) {
  if(!r || !selectedId) return {kind:'missing', candidates:[]};
  const candidates=neighbours(r,selectedId,direction==='back'?'back':'next');
  if(!candidates.length)return {kind:'end',candidates:[]};
  if(direction==='back'){
    const last=history.at(-1);
    if(last?.to===selectedId){
      const found=candidates.find(c=>c.node.id===last.from);
      if(found)return {kind:'single',candidate:found,fromHistory:true,candidates};
    }
  }
  if(candidates.length===1)return {kind:'single',candidate:candidates[0],fromHistory:false,candidates};
  return {kind:'choose',candidates};
}
