// Apresentação transitória de alterações; não persiste nem altera o modelo.
export const BATCH_HIGHLIGHT_MS=30000;
export function batchVisualDiff(change){
 if(!change||!change.id||!change.before||!change.after)return null;
 const fields=[];
 if(change.before.type!==change.after.type)fields.push({key:'type',label:'Tipo',before:change.before.type,after:change.after.type});
 if(change.before.classification!==change.after.classification)fields.push({key:'classification',label:'Natureza',before:change.before.classification||'',after:change.after.classification||''});
 return fields.length?{id:change.id,fields}:null;
}
export function batchVisualMap(changes){return new Map((changes||[]).map(batchVisualDiff).filter(Boolean).map(v=>[v.id,v]));}
