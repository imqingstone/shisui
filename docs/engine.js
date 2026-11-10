/* Data and selection logic; contains no answer copy. */
(function(root){
'use strict';
function validateAnswers(data){
 if(!Array.isArray(data)||!data.length||data.length>100000)throw Error('答案庫必須是非空陣列。');
 const seen=new Set();
 return data.map((row,i)=>{
  if(!row||(typeof row.id!=='string'&&!Number.isSafeInteger(row.id))||!String(row.id).trim()||typeof row.answer!=='string'||!row.answer.trim()||typeof row.reflection!=='string'||!row.reflection.trim())throw Error('第 '+(i+1)+' 則資料缺少有效的 id、answer 或 reflection。');
  const id=String(row.id).trim();if(seen.has(id))throw Error('答案 id 重複：'+id);seen.add(id);
  return {id,answer:row.answer.trim(),reflection:row.reflection.trim()};
 });
}
function randomIndex(n,source){
 if(!Number.isInteger(n)||n<1||n>4294967296)throw Error('無效的抽取範圍');
 const limit=Math.floor(4294967296/n)*n;let value;
 do{value=source?source():root.crypto.getRandomValues(new Uint32Array(1))[0];if(!Number.isInteger(value)||value<0||value>=4294967296)throw Error('無效亂數');}while(value>=limit);
 return value%n;
}
function pick(data,lastId,source){
 if(!data.length)throw Error('沒有答案');
 const pool=data.length>1?data.filter(row=>row.id!==lastId):data;
 return pool[randomIndex(pool.length,source)];
}
function validateSaved(data){
 if(!data||data.version!==1||!Array.isArray(data.items))throw Error('收藏格式不符');
 if(data.items.length===0)return {version:1,items:[]};
 const rows=validateAnswers(data.items);
 return {version:1,items:rows.map((row,i)=>{const date=data.items[i].savedAt;if(typeof date!=='string'||!Number.isFinite(Date.parse(date)))throw Error('收藏日期無效');return {...row,savedAt:date}})};
}
function toggleSaved(items,row,date){return items.some(x=>x.id===row.id)?items.filter(x=>x.id!==row.id):[{...row,savedAt:date},...items]}
const api={validateAnswers,randomIndex,pick,validateSaved,toggleSaved};root.Shisui=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
