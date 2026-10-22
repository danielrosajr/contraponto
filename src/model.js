export const TYPES = {
  pergunta: ['Pergunta','?','#70b9ff'], premissa: ['Premissa','◈','#bca8ff'], argumento: ['Argumento','↗','#80cba8'],
  objecao: ['Objeção','!','#fa9b8c'], contra: ['Contra-argumento','↩','#8dc9d2'], exemplo: ['Exemplo','▦','#e6bb7f'],
  cenario: ['Cenário','◇','#ce9de6'], emocao: ['Emoção','♡','#f0a9c0'], valor: ['Valor pessoal','✧','#f1d07f'],
  provisoria: ['Conclusão provisória','◉','#d1b06e'], final: ['Conclusão final','✓','#8bd3af'], retorno: ['Retorno ao tema','↶','#9eaff7'],
  comentario: ['Comentário','☷','#9eb6c8'], pausa: ['Pausa / marcador','⏸','#d9ac87'],
  acordo: ['Concordância provisória','≈','#83c4ad'], meta: ['Metacomentário','↹','#9e9bcf'], roteiro: ['Organização / roteiro','☰','#b5b2e9']
};
export const RELATIONS = {
  continua: 'Continua', apoia: 'Apoia', contesta: 'Contesta', depende: 'Depende de', exemplifica: 'Exemplifica',
  reformula: 'Reformula', retorna: 'Retorna a'
};
export const CLASSES = {'': 'Não classificado', fato: 'Fato', opiniao: 'Opinião', hipotese: 'Hipótese', sentimento: 'Sentimento', verificar: 'A verificar'};
export const STATES = {ativo:'Ativo',contestado:'Contestado',revisado:'Revisado',abandonado:'Abandonado'};
export const PROMPTS = [
  'E se a situação fosse inversa?', 'Isso é um fato ou uma suposição?', 'Que evidência sustentaria essa afirmação?',
  'O que faria você mudar de ideia?', 'Existe outra explicação possível?', 'Você está confundindo consequência com intenção?',
  'Essa conclusão é válida para qualquer pessoa?', 'Você está generalizando um caso individual?',
  'O que alguém que discorda de você responderia?', 'Existe alguma contradição com um pensamento anterior?',
  'Você está falando sobre o que sente ou sobre o que acredita que deveria sentir?',
  'Você está respondendo à pergunta original?', 'Quais circunstâncias mudariam sua resposta?',
  'Essa ideia ainda vale quando considero o ponto de vista de outra pessoa?',
  'Estou falando de como me sinto ou de algo que considero moralmente aceitável?',
  'Não sentir sofrimento significa necessariamente não sofrer consequências?',
  'O que muda quando considero autonomia, consentimento e confiança?',
  'Se a outra pessoa não souber, isso me dá o direito de decidir por ela?',
  'Minha reação mudaria se a pessoa me contasse espontaneamente?',
  'Estou confundindo compreender a motivação com concordar com a conduta?',
  'O que minha voz crítica ainda não conseguiu explicar claramente?'
];
export const uid = (p='id') => `${p}_${globalThis.crypto?.randomUUID?.() || (Date.now().toString(36)+Math.random().toString(36).slice(2))}`;
export const now = () => new Date().toISOString();
export const defaultVoices = () => [
  {id:'eu1',name:'Eu inicial',color:'#6db5ff'}, {id:'eu2',name:'Eu crítico',color:'#f3a382'},
  {id:'observador',name:'Observador',color:'#bca4fb'}
];
export function newReflection(title,question,description='',tags=[]) {
  const ts=now(); const id=uid('reflection');
  return {id,title:title.trim(),question:question.trim(),description:description.trim(),status:'em andamento',archived:false,tags,
    createdAt:ts,updatedAt:ts,voices:defaultVoices(),nodes:[{id:uid('node'),type:'pergunta',title:'Pergunta principal',content:question.trim(),notes:'',classification:'',state:'ativo',voiceId:'eu1',x:0,y:0,collapsed:false,createdAt:ts,updatedAt:ts}],edges:[]};
}
export function makeDemo() {
  const r = newReflection('O que significa ser afetado pelo desconhecido?', 'O que significa dizer que algo não me afeta se eu desconheço sua existência?',
    'Reflexão fictícia demonstrativa. Explore caminhos, objeções, cenários e um retorno à pergunta original.', ['demonstração', 'filosofia']);
  const d=[
    ['premissa','Sofrimento consciente','Se desconheço um acontecimento, não posso sofrer conscientemente por ele naquele instante.','eu1',360,-160],
    ['objecao','E as consequências?','Não perceber algo elimina as consequências que isso pode produzir na minha vida?','eu2',720,-210],
    ['contra','Duas dimensões','Ausência de sofrimento imediato não significa ausência de efeitos concretos.','eu1',1080,-230],
    ['cenario','Cenário A','Uma pessoa esconde um fato sem alterar em nada minhas decisões ou meu cotidiano.','eu1',720,65],
    ['cenario','Cenário B','Uma informação omitida me impede de fazer escolhas importantes.','eu2',1080,85],
    ['pergunta','O que é ser afetado?','Estou falando de sentir algo, de perder autonomia ou de sofrer consequências?','observador',1440,-115],
    ['valor','Autonomia','Valorizar a possibilidade de escolher com base em informações relevantes.','eu1',1440,180],
    ['retorno','Voltar ao centro','Agora volto à pergunta original, distinguindo o que sinto do que realmente acontece.','observador',1800,-35],
    ['provisoria','Conclusão provisória','Não saber pode impedir sofrimento consciente imediato, mas não garante ausência de consequências, nem preserva necessariamente minha autonomia.','eu1',2160,-45],
    ['roteiro','Organizando o exercício','Quero comparar o que sinto, o que acontece e o que considero justo em cada cenário.','observador',325,420],
    ['comentario','Pensamento solto','Ainda não sei se este exemplo realmente ajuda. Vou deixá-lo registrado.','eu1',700,440],
    ['acordo','Aceito por enquanto','Aceito temporariamente essa distinção, mas quero testá-la em outra situação.','eu2',1090,460],
    ['meta','Sobre o debate','Não preciso transformar toda fala do meu diálogo interno em argumento.','observador',1480,480],
    ['pausa','Retomar depois','Na próxima sessão: investigar melhor a diferença entre dano e julgamento moral.','observador',1860,450]
  ];
  const ts=now();
  for (const [type,title,content,voiceId,x,y] of d) r.nodes.push({id:uid('node'),type,title,content,voiceId,x,y,notes:'',classification:'hipotese',state:'ativo',collapsed:false,createdAt:ts,updatedAt:ts});
  const link=(a,b,relation)=>r.edges.push({id:uid('edge'),source:r.nodes[a].id,target:r.nodes[b].id,relation,createdAt:ts});
  link(0,1,'continua');link(1,2,'contesta');link(2,3,'continua');link(2,4,'exemplifica');link(4,5,'contesta');
  link(3,6,'continua');link(5,6,'exemplifica');link(6,7,'reformula');link(7,8,'apoia');link(8,0,'retorna');link(8,9,'continua');link(0,10,'continua');link(10,11,'continua');link(11,12,'continua');link(12,13,'continua');link(13,14,'continua');
  r.nodes[11].annotations=[{id:uid('note'),text:'Esta observação não precisa virar outro argumento. É apenas uma nota anexada ao bloco.',createdAt:ts}];
  return r;
}
export function initialData() { return {schemaVersion:2,settings:{theme:'dark'},reflections:[makeDemo()]}; }
export function safeText(s) {return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
export function niceDate(iso) { return iso ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso)) : '—'; }
export function cleanFilename(s){return String(s||'reflexao').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,65) || 'reflexao';}
export function normalizeImported(obj) {
  if(!obj || typeof obj!=='object') throw Error('Arquivo inválido.');
  const raw = Array.isArray(obj.reflections)?obj.reflections : Array.isArray(obj.nodes)&&Array.isArray(obj.edges)?[obj]:null;
  if(!raw || raw.length>100)throw Error('O JSON não contém reflexões válidas (ou excede 100 reflexões).');
  const reflections=[];
  for(const r of raw){
    if(!r || typeof r!=='object' || !Array.isArray(r.nodes) || !Array.isArray(r.edges) || r.nodes.length>3000 || r.edges.length>12000)throw Error('Estrutura de mapa inválida ou grande demais.');
    const unique=new Set(); const nodes=[];
    for(const n of r.nodes){
      if(!n || typeof n.id!=='string' || unique.has(n.id))throw Error('Bloco com identificador inválido/duplicado.');
      unique.add(n.id);
      nodes.push({id:n.id.slice(0,130),type:TYPES[n.type]?n.type:'premissa',title:String(n.title||'').slice(0,250),content:String(n.content||'').slice(0,30000),
        notes:String(n.notes||'').slice(0,30000),classification: n.classification in CLASSES ? n.classification:'',state:n.state in STATES ?n.state:'ativo',
        voiceId:String(n.voiceId||'eu1'),x:Number.isFinite(n.x)?Math.max(-100000,Math.min(100000,n.x)):0,
        y:Number.isFinite(n.y)?Math.max(-100000,Math.min(100000,n.y)):0,
        annotations:Array.isArray(n.annotations)?n.annotations.slice(0,100).map(a=>({id:String(a?.id||uid('note')).slice(0,130),text:String(a?.text||'').slice(0,6000),createdAt:a?.createdAt||now()})).filter(a=>a.text.trim()):[],
        collapsed:!!n.collapsed,createdAt:n.createdAt||now(),updatedAt:n.updatedAt||now()});
    }
    const edges=r.edges.filter(e=>e && unique.has(e.source) && unique.has(e.target) && e.source!==e.target).map(e=>({
      id:typeof e.id==='string'?e.id:uid('edge'),source:e.source,target:e.target,relation:RELATIONS[e.relation]?e.relation:'continua',createdAt:e.createdAt||now()
    }));
    const voices=(Array.isArray(r.voices)?r.voices:defaultVoices()).slice(0,60).map(v=>({id:String(v.id||uid('voice')),name:String(v.name||'Voz').slice(0,60),color:/^#[0-9a-fA-F]{6}$/.test(v.color)?v.color:'#6db5ff'}));
    reflections.push({id:typeof r.id==='string'?r.id:uid('reflection'),title:String(r.title||'Sem título').slice(0,250),
      question:String(r.question||'').slice(0,10000),description:String(r.description||'').slice(0,20000),
      status:['em andamento','pausado','concluído'].includes(r.status)?r.status:'em andamento',archived:!!r.archived,
      tags:Array.isArray(r.tags)?r.tags.slice(0,20).map(t=>String(t).slice(0,50)):[],createdAt:r.createdAt||now(),updatedAt:r.updatedAt||now(),
      voices:voices.length?voices:defaultVoices(),nodes,edges});
  }
  return reflections;
}
