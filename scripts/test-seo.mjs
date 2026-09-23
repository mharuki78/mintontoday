import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
const base = "http://127.0.0.1:3018";
await mkdir("output",{recursive:true});
const directory = await mkdtemp(path.resolve("output","seo-test-"));
const post = {id:"seo-test-post",title:"검색 메타데이터 테스트",excerpt:"검색에 필요한 제목과 날짜를 확인하는 테스트 글입니다.",body:"코트에서 함께 운동하는 사람들을 위한 테스트 본문입니다. 검색과 관련된 메타데이터와 이미지 주소를 검증합니다.",category:"코트 라이프",status:"published",sample:false,date:"2026-09-22",updatedAt:"2026-09-23T00:00:00Z",art:"court",images:[{url:"/images/editorial/court-cleanup-20260923.webp",alt:"코트 정리 일러스트",caption:"AI 일러스트",credit:"Minton Today",sourceUrl:"https://mintontoday.com/editorial",rights:"직접 생성한 이미지",kind:"illustration",generated:true}]};
await writeFile(path.join(directory,"posts.json"),JSON.stringify([post,{...post,id:"seo-draft",status:"draft"}]));
const server = spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3018"],{stdio:["ignore","pipe","pipe"],env:{...process.env,DATABASE_URL:"",DATABASE_URL_UNPOOLED:"",VERCEL:"",CONTENT_DIR:directory,SITE_URL:"https://mintontoday.com"}});
try {
  await new Promise((resolve,reject)=>{let log="";const timer=setTimeout(()=>reject(new Error("Server timeout")),30000);const read=data=>{log+=data;if(log.includes("Ready in")){clearTimeout(timer);resolve();}};server.stdout.on("data",read);server.stderr.on("data",read);server.once("exit",()=>{clearTimeout(timer);reject(new Error("Server exited"));});});
  const read=async route=>{const response=await fetch(base+route);assert.equal(response.status,200,route);return response.text();};
  const home=await read("/");assert.match(home,/name="google-site-verification"/);assert.match(home,/name="naver-site-verification"/);assert.match(home,/rel="canonical" href="https:\/\/mintontoday.com"/);
  const sitemap=await read("/sitemap.xml");assert.ok(sitemap.includes(post.updatedAt));assert.ok(sitemap.includes("https://mintontoday.com/images/editorial/court-cleanup-20260923.webp"));assert.ok(!sitemap.includes("seo-draft"));
  const robots=await read("/robots.txt");assert.match(robots,/Allow: \/api\/media\//);assert.match(robots,/Disallow: \/admin/);
  const rss=await read("/rss.xml");assert.ok(rss.includes(post.body));assert.ok(!rss.includes("seo-draft"));assert.match(rss,/<rss version="2.0"/);
  const article=await read("/articles/seo-test-post");assert.ok(article.includes('"image":["https://mintontoday.com/images/'));assert.ok(article.includes('"publisher":'));
  const category=await read("/articles?category="+encodeURIComponent("뉴스"));assert.ok(category.includes("배드민턴 뉴스 | Minton Today"));
  const search=await read("/articles?q=test");assert.match(search,/name="robots" content="noindex, follow"/);
  console.log("SEO smoke tests passed: verification, canonicals, category titles, search noindex, image crawl access, updated sitemap and RSS.");
} finally {if(server.exitCode===null){const done=once(server,"exit");server.kill();await done;}}
