import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { seeds } from '../lib/content.ts';

await mkdir('output', { recursive:true });
const directory=await mkdtemp(path.resolve('output','public-cache-test-'));
const file=path.join(directory,'posts.json');
const base='http://localhost:3044';
const secret='local-public-cache-test-secret-only-123456789';
const original={...seeds[2],id:'cache-regression',title:'캐시 변경 전의 글',sample:false,body:'본문으로만찾는문장 '+ '이것은 공개 캐시 회귀 검사를 위한 실제 본문입니다. '.repeat(4)};
let posts=[original,{...original,id:'private-draft',title:'절대 공개하면 안 되는 초안',status:'draft'},...Array.from({length:28},(_,i)=>({...original,id:`paged-${String(i).padStart(2,'0')}`,title:`목록 분할 글 ${i}`,body:'목록 테스트를 위한 충분한 길이의 본문입니다. '.repeat(4)})),seeds[0]];
await writeFile(file,JSON.stringify(posts));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','localhost','--port','3044'],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:'',DATABASE_URL_UNPOOLED:'',VERCEL:'',CONTENT_DIR:directory,SESSION_SECRET:secret,EDITORIAL_CACHE_SECRET:secret,ADMIN_PASSWORD:'local-cache-test-password',SITE_URL:'https://mintontoday.com'}});
const get=async route=>{const r=await fetch(base+route);assert.equal(r.status,200,route);return r.text();};
let serverLog='';
server.stdout.on('data',data=>serverLog+=data);
server.stderr.on('data',data=>serverLog+=data);
try{
 await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Server timeout')),30000);const read=data=>{log+=data;if(log.includes('Ready in')){clearTimeout(timer);resolve();}};server.stdout.on('data',read);server.stderr.on('data',read);server.once('exit',()=>reject(Error('Server exited')));});
 assert.ok((await get('/articles/cache-regression')).includes(original.title));
 posts[0]={...original,title:'실제로 변경된 새 제목'};
 await writeFile(file,JSON.stringify(posts));
 assert.ok((await get('/articles/cache-regression')).includes(original.title),'Repeated public requests must reuse cached data until invalidated');
 const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password:'local-cache-test-password'})});
 assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 assert.ok((await (await fetch(base+'/admin',{headers:{Cookie:cookie}})).text()).includes(posts[0].title),'Admin reads must remain fresh');
 const manual={...posts[0],title:'운영자가 저장한 최신 제목'};
 const saved=await fetch(base+'/api/admin/posts',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(manual)});
 assert.equal(saved.status,200);
 assert.ok((await get('/articles/cache-regression')).includes(manual.title),'Manual saves invalidate detail');
 assert.ok((await get('/articles')).includes(manual.title),'Manual saves invalidate archive');
 assert.equal((await fetch(base+'/articles/private-draft')).status,404);
 assert.equal((await fetch(base+'/articles/first-racket')).status,404,'Seeds stay hidden when editorial posts exist');
 const page1=await get('/articles');const page2=await get('/articles?page=2');
 assert.equal((page1.match(/class="article-card"/g)||[]).length,24);
 assert.equal((page2.match(/class="article-card"/g)||[]).length,5);
 assert.match(page1,/29(?:<!--.*?-->)*개의 이야기/);
 assert.ok((await get('/articles?q=본문으로만찾는문장')).includes(manual.title),'Search must find body-only terms without transferring full bodies');
 assert.ok((await get('/articles?q=%25')).includes('아직 이 이야기는 없어요.'),'LIKE wildcards are literal search input');
 assert.ok((await get('/rss.xml')).includes(manual.title));
 const beforeIndex=await get('/sitemap.xml');assert.ok(beforeIndex.includes('cache-regression'));
 posts=JSON.parse(await readFile(file,'utf8'));posts[0]={...posts[0],title:'자동 발행 후 새 제목'};await writeFile(file,JSON.stringify(posts));
 const time=String(Date.now());const signature=createHmac('sha256',secret).update(time).digest('hex');
 const hook=await fetch(base+'/api/editorial/revalidate',{method:'POST',headers:{'X-Editorial-Time':time,'X-Editorial-Signature':signature}});
 assert.equal(hook.status,200);
 assert.ok((await get('/articles/cache-regression')).includes(posts[0].title),'Automated publication invalidates detail');
 assert.equal((await fetch(base+'/api/editorial/revalidate',{method:'POST'})).status,401);
 const expired=String(Date.now()-600000);
 assert.equal((await fetch(base+'/api/editorial/revalidate',{method:'POST',headers:{'X-Editorial-Time':expired,'X-Editorial-Signature':createHmac('sha256',secret).update(expired).digest('hex')}})).status,401);
 const withdrawn=await fetch(base+'/api/admin/posts',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({...posts[0],status:'draft'})});assert.equal(withdrawn.status,200);
 assert.equal((await fetch(base+'/articles/cache-regression')).status,404,'Unpublishing removes previously cached content');
 assert.ok(!(await get('/sitemap.xml')).includes('/articles/cache-regression'));
 assert.ok(!(await get('/rss.xml')).includes(posts[0].title));
 console.log('PASS: persistent public cache, fresh admin, save/hook/unpublish invalidation, paging, body search, hidden drafts, RSS and sitemap');
 if(process.argv.includes('--suite')){
  const suite=spawn(process.execPath,['--test','tests/*.test.mjs'],{stdio:'inherit',env:{...process.env,TEST_BASE_URL:base,EXPECT_EDITORIAL:'1'}});
  const [code]=await once(suite,'exit');assert.equal(code,0,'Full unit/API test suite');
 }
}catch(error){console.error(serverLog);throw error;}
finally{if(server.exitCode===null){const done=once(server,'exit');server.kill();await done;}}
