import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homeStructuredData, articleStructuredData, serializeStructuredData } from '../lib/structured-data.ts';

const base='https://mintontoday.com/';
const post={id:'schema-test',title:'배드민턴 글',excerpt:'같은 제목과 날짜로 독자에게 표시되는 글입니다.',body:'공개 본문입니다.',category:'코트 라이프',date:'2026-09-22',newsDate:'2026-09-17',seriesDate:'2026-09-18',status:'published',sample:false,art:'court',sourceUrl:'https://example.org/report',sourceName:'원문',sources:[{name:'원문',url:'https://example.org/report'}],images:[{url:'/images/example.webp',caption:'2018년 자료사진',alt:'배드민턴 경기',credit:'사진 저자',rights:'기록된 사용 근거',sourceUrl:'https://example.org/photo',kind:'photo',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}]};
const node=(data,type)=>data['@graph'].find(n=>n['@type']===type);

test('site name and publisher use stable identities, actual contact, crawlable logo and no invented profiles',()=>{
  const data=homeStructuredData(base);
  const site=node(data,'WebSite'),org=node(data,'Organization');
  assert.equal(site.name,'Minton Today');assert.equal(site.alternateName,'민턴투데이');
  assert.equal(site.url,base);assert.equal(site.publisher['@id'],org['@id']);
  assert.equal(org.email,'baekhyunjin@gmail.com');
  assert.equal(org.logo.contentUrl,base+'apple-icon.png');
  assert.ok(org.logo.width>=112&&org.logo.height>=112);
  assert.equal(org.publishingPrinciples,base+'editorial');
  for(const unsupported of ['sameAs','address','legalName','aggregateRating']) assert.ok(!(unsupported in org));
});
test('article graph connects canonical page, publisher and real hierarchy without inventing publication time',()=>{
  const data=articleStructuredData(post,base),article=node(data,'BlogPosting'),page=node(data,'WebPage'),org=node(data,'Organization');
  assert.equal(article.headline,post.title);assert.equal(article.datePublished,'2026-09-22');
  assert.ok(!('dateModified' in article));
  assert.equal(article.mainEntityOfPage['@id'],page['@id']);
  assert.equal(page.mainEntity['@id'],article['@id']);
  assert.equal(article.publisher['@id'],org['@id']);assert.equal(article.author['@id'],org['@id']);
  assert.equal(article.url,base+'articles/schema-test');
  assert.equal(page.isPartOf['@id'],node(homeStructuredData(base),'WebSite')['@id']);
  const crumbs=node(data,'BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map(c=>c.position),[1,2,3]);
  assert.equal(new URL(crumbs[1].item).searchParams.get('category'),post.category);
  assert.equal(crumbs[2].item,article.url);
  assert.equal(article.isAccessibleForFree,true);
  assert.equal(article.citation.length,1);
});
test('news keeps actual revision offset and photo credit/licence while missing photos stay missing',()=>{
  const updatedAt='2026-10-27T16:00:00+09:00';
  const article=node(articleStructuredData({...post,category:'뉴스',updatedAt},base),'NewsArticle');
  assert.equal(article.dateModified,updatedAt);
  assert.equal(article.image[0].contentUrl,base+'images/example.webp');
  assert.equal(article.image[0].creditText,'사진 저자');
  assert.equal(article.image[0].license,post.images[0].licenseUrl);
  const noImage=node(articleStructuredData({...post,images:[],sourceUrl:'',sources:[]},base),'BlogPosting');
  assert.ok(!('image' in noImage));assert.ok(!('citation' in noImage));
  const noLicense=node(articleStructuredData({...post,images:[{...post.images[0],licenseUrl:undefined}]},base),'BlogPosting');
  assert.ok(!('license' in noLicense.image[0]));
});
test('drafts and samples emit no article claim and JSON-LD cannot break out of its script element',()=>{
  assert.equal(articleStructuredData({...post,status:'draft'},base),null);
  assert.equal(articleStructuredData({...post,sample:true},base),null);
  const title='제목 </script><script>alert(1)</script>';
  const data=articleStructuredData({...post,title},base),serialized=serializeStructuredData(data);
  assert.ok(!serialized.includes('<'));assert.equal(node(JSON.parse(serialized),'BlogPosting').headline,title);
});
