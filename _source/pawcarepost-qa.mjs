import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import addedArticles from './pawcarepost-added-articles.mjs';
const sourceDir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(sourceDir,'..');
const readJson=name=>JSON.parse(fs.readFileSync(path.join(sourceDir,name),'utf8'));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const html=walk(root).filter(x=>x.endsWith('.html'));
const broken=[];let images=0,links=0,dates=[];
for(const file of html){const s=fs.readFileSync(file,'utf8');for(const m of s.matchAll(/\b(?:href|src)="([^"]+)"/g)){let v=m[1];if(!v||v.startsWith('#')||/^(?:https?:|mailto:|data:)/.test(v))continue;const target=path.resolve(path.dirname(file),decodeURIComponent(v.split(/[?#]/)[0]));if(!target.startsWith(root+path.sep)&&target!==root){broken.push(`${file}: escaped root ${v}`);continue}const found=fs.existsSync(target)||fs.existsSync(path.join(target,'index.html'));if(!found)broken.push(`${file}: ${v}`);if(/\.(?:jpe?g|png|svg)$/.test(v))images++;else links++}if(!/<meta name="description" content="[^"]+"/.test(s))broken.push(`${file}: missing description`);if(!/<link rel="canonical" href="https:\/\/pawcarepost\.com\//.test(s))broken.push(`${file}: missing canonical`);if(/\p{Script=Han}/u.test(s))broken.push(`${file}: Chinese text`);dates.push(...[...s.matchAll(/datetime="(2026-\d\d-\d\d)"/g)].map(x=>x[1]));}
const articlePages=html.filter(f=>/\\(?:dog-care|cat-care|pet-health|food-nutrition|training-lifestyle)\\[^\\]+\\index\.html$/.test(f));
const contents=[...readJson('pawcarepost-articles.json'),...addedArticles];
if(new Set(contents.map(a=>a.slug)).size!==contents.length)broken.push('Duplicate article slugs');
if(new Set(contents.map(a=>a.title.toLowerCase())).size!==contents.length)broken.push('Duplicate article titles');
for(const category of new Set(contents.map(a=>a.category))){
  if(addedArticles.filter(a=>a.category===category).length!==2)broken.push(`${category}: expected two new articles`);
}
const publicationDates=readJson('pawcarepost-publication-dates.json');
const wordCounts=readJson('pawcarepost-content-report.json');
const allPublicationDates=contents.map(a=>publicationDates[a.slug]);
if(new Set(allPublicationDates).size!==contents.length)broken.push('Publication dates are missing or repeated');
for(const category of new Set(contents.map(a=>a.category))){
  const categoryArticles=contents.filter(a=>a.category===category);
  const days=categoryArticles.map(a=>publicationDates[a.slug]?.slice(-2));
  if(new Set(days).size!==categoryArticles.length)broken.push(`${category}: repeated day of the month`);
}
const searchIndex=JSON.parse(fs.readFileSync(path.join(root,'assets','search-index.js'),'utf8').replace(/^window\.PAW_SEARCH_INDEX=/,'').replace(/;$/,''));
const renderedWords=[];let chartPages=0,diagramPages=0,maxMajorHeadings=0;
for(const item of wordCounts){
  if(item.words<2000||item.words>2300)broken.push(`${item.slug}: ${item.words} words`);
  const a=contents.find(x=>x.slug===item.slug);
  if(a?.added && (item.titleLength>=60||item.metaLength<120||item.metaLength>160))broken.push(`${item.slug}: SEO metadata length`);
  const s=fs.readFileSync(path.join(root,a.category,a.slug,'index.html'),'utf8');
  const expectedDate=publicationDates[item.slug];
  if(!s.includes(`<time datetime="${expectedDate}">`))broken.push(`${item.slug}: article date mismatch`);
  if(!s.includes(`"datePublished":"${expectedDate}"`))broken.push(`${item.slug}: schema date mismatch`);
  const categoryPage=fs.readFileSync(path.join(root,'category',a.category,'index.html'),'utf8');
  const card=[...categoryPage.matchAll(/<article class="article-card">.*?<\/article>/g)].map(x=>x[0]).find(x=>x.includes(`/${a.category}/${item.slug}/`));
  if(!card?.includes(`<time datetime="${expectedDate}">`))broken.push(`${item.slug}: category card date mismatch`);
  const hit=searchIndex.find(x=>x.url.endsWith(`/${item.slug}/`));
  const formattedDate=new Date(expectedDate+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
  if(hit?.date!==formattedDate)broken.push(`${item.slug}: search date mismatch`);
  if(!s.includes('class="article-inline"'))broken.push(`${item.slug}: missing inline image`);
  if(!s.includes(`assets/images/articles/${item.slug}.jpg`))broken.push(`${item.slug}: missing featured image`);
  if(!s.includes(`assets/images/articles/${item.slug}-detail.jpg`))broken.push(`${item.slug}: missing unique inline image`);
  if(s.includes('class="toc"')||s.includes('In this guide')||s.includes('aria-label="Table of contents"'))broken.push(`${item.slug}: unwanted article contents box`);
  if(!s.includes('"@type":"FAQPage"'))broken.push(`${item.slug}: missing FAQ schema`);
  const start=s.indexOf('<div class="article-content">');
  const end=s.indexOf('</div><aside class="author-box">',start);
  if(start<0||end<0){broken.push(`${item.slug}: missing article body`);continue}
  const body=s.slice(start,end);
  const visibleWords=body.replace(/<[^>]*>/g,' ').replace(/&[a-z]+;/gi,' ').trim().split(/\s+/).length;
  renderedWords.push(visibleWords);
  if(visibleWords<2000||visibleWords>2300)broken.push(`${item.slug}: ${visibleWords} rendered words`);
  const majorHeadings=[...body.matchAll(/<h2>/g)].length;
  maxMajorHeadings=Math.max(maxMajorHeadings,majorHeadings);
  if(majorHeadings>6)broken.push(`${item.slug}: ${majorHeadings} major headings`);
  if(body.includes('class="article-chart"'))chartPages++;
  if(body.includes('class="process-diagram"'))diagramPages++;
}
console.log(JSON.stringify({html:html.length,articlePages:articlePages.length,links,images,broken:broken.slice(0,20),brokenCount:broken.length,minWords:Math.min(...wordCounts.map(x=>x.words)),maxWords:Math.max(...wordCounts.map(x=>x.words)),renderedMinWords:Math.min(...renderedWords),renderedMaxWords:Math.max(...renderedWords),maxMajorHeadings,chartPages,diagramPages,dates:[...new Set(dates)].sort()},null,2));
if(broken.length)process.exitCode=1;

