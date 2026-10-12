import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import addedArticles from './pawcarepost-added-articles.mjs';
import relatedArticles from './pawcarepost-related.mjs';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(sourceDir, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(sourceDir, name), 'utf8'));
const articles = [...readJson('pawcarepost-articles.json'), ...addedArticles];
const expansions = ['dog','cat','health','food','lifestyle'].flatMap(name => readJson(`pawcarepost-expansions-${name}.json`));
const bridges = readJson('pawcarepost-bridges.json');
const finishing = readJson('pawcarepost-finishing.json');
const detailAlts = readJson('pawcarepost-detail-alts.json');
const depth = Object.assign({}, ...(await Promise.all(['dog', 'cat', 'health', 'food', 'lifestyle'].map(name => import(`./pawcarepost-depth-${name}.mjs`)))).map(module => module.default));
const finalDepth = (await import('./pawcarepost-depth-final.mjs')).default;
const visualGuides = (await import('./pawcarepost-visual-guides.mjs')).default;
const sourceExtras = {
  'why-is-my-dog-shaking': [['FDA: Xylitol is toxic to dogs', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/paws-xylitol-toxic-dogs']],
  'when-should-you-take-your-pet-to-the-vet': [['FDA: Who to call in a pet emergency', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/who-do-you-call-if-you-have-pet-emergency']],
  'can-dogs-eat-bananas': [['FDA: Xylitol is toxic to dogs', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/paws-xylitol-toxic-dogs']],
  'can-cats-eat-cooked-chicken': [['FDA: Potentially dangerous items for pets', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/potentially-dangerous-items-your-pet'], ['FDA: Raw pet food safety', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/get-facts-raw-pet-food-diets-can-be-dangerous-you-and-your-pet']],
  'wet-vs-dry-cat-food': [['FDA: Proper storage of pet food and treats', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/proper-storage-pet-food-treats']],
  'how-often-should-you-feed-an-adult-dog': [['FDA: Proper storage of pet food and treats', 'https://www.fda.gov/animal-veterinary/animal-health-literacy/proper-storage-pet-food-treats']],
  'how-to-stop-a-dog-from-barking-at-everything': [['AVSAB: Humane dog training position statement', 'https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf']],
  'how-to-help-a-cat-adjust-to-a-new-home': [['FelineVMA: Setting up the environment for success', 'https://catvets.com/resource/setting-up-for-success/']],
  'why-does-my-cat-scratch-the-furniture': [['FelineVMA: Setting up the environment for success', 'https://catvets.com/resource/setting-up-for-success/']],
};
const bySlug = new Map(expansions.map(e => [e.slug, e]));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const categoryImages = { 'dog-care': ['dog-care.jpg', 'A dog relaxing during a grooming session at home'], 'cat-care': ['cat-care.jpg', 'A tabby cat beside a clean litter box at home'], 'pet-health': ['pet-health.jpg', 'A veterinarian calmly examining a dog'], 'food-nutrition': ['food-nutrition.jpg', 'A dog and cat near their separate food and water bowls'], 'training-lifestyle': ['training-lifestyle.jpg', 'An owner training a dog with a reward outdoors'] };
const formats = ['steps', 'checklist', 'comparison', 'triage', 'routine', 'myths'];

function formatBlock(e) {
  const items = e.structure.map(([label, copy]) => ({ label: esc(label), copy: esc(copy) }));
  const format = e.format || formats[articles.findIndex(a => a.slug === e.slug) % formats.length];
  if (format === 'steps') return `<div class="format-block format-steps"><h4>${esc(e.structureTitle)}</h4><ol>${items.map(x => `<li><strong>${x.label}</strong><span>${x.copy}</span></li>`).join('')}</ol></div>`;
  if (format === 'checklist') return `<div class="format-block format-checklist"><h4>${esc(e.structureTitle)}</h4><ul>${items.map(x => `<li><strong>${x.label}</strong> ${x.copy}</li>`).join('')}</ul></div>`;
  if (format === 'comparison') return `<div class="format-block"><h4>${esc(e.structureTitle)}</h4><div class="table-scroll"><table><thead><tr><th scope="col">Situation</th><th scope="col">Practical response</th></tr></thead><tbody>${items.map(x => `<tr><th scope="row">${x.label}</th><td>${x.copy}</td></tr>`).join('')}</tbody></table></div></div>`;
  if (format === 'triage') return `<div class="format-block format-triage"><h4>${esc(e.structureTitle)}</h4><div class="triage-grid">${items.map(x => `<div><strong>${x.label}</strong><p>${x.copy}</p></div>`).join('')}</div></div>`;
  if (format === 'routine') return `<div class="format-block format-routine"><h4>${esc(e.structureTitle)}</h4><div class="routine-grid">${items.map(x => `<div><span>${x.label}</span><p>${x.copy}</p></div>`).join('')}</div></div>`;
  return `<div class="format-block format-myths"><h4>${esc(e.structureTitle)}</h4><dl>${items.map(x => `<dt>${x.label}</dt><dd>${x.copy}</dd>`).join('')}</dl></div>`;
}

function deepDive(e) {
  return `<div class="further-details"><h2>Practical details</h2>${e.sections.map((section, i) => `<section id="deep-${i + 1}" class="deep-section"><h3>${esc(section[0])}</h3>${section.slice(1).map(p => `<p>${esc(p)}</p>`).join('')}${i === 0 ? formatBlock(e) : ''}</section>`).join('')}</div>`;
}

function appendToSection(html, id, markup) {
  const start = html.indexOf(`<section id="${id}"`);
  const end = html.indexOf('</section>', start);
  if (start < 0 || end < 0) throw new Error(`Cannot find article section ${id}`);
  return html.slice(0, end) + markup + html.slice(end);
}

function paragraphs(text) {
  return text.trim().split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join('');
}

function visualGuide(guide) {
  const rows = guide.rows.map(([label, description]) => ({ label: esc(label), description: esc(description) }));
  const content = guide.kind === 'steps'
    ? `<ol class="process-diagram">${rows.map(row => `<li><strong>${row.label}</strong><span>${row.description}</span></li>`).join('')}</ol>`
    : guide.kind === 'checklist'
      ? `<ul class="visual-checklist">${rows.map(row => `<li><strong>${row.label}</strong> ${row.description}</li>`).join('')}</ul>`
      : guide.kind === 'triage'
        ? `<div class="triage-grid">${rows.map(row => `<div><strong>${row.label}</strong><p>${row.description}</p></div>`).join('')}</div>`
        : guide.kind === 'routine'
          ? `<div class="routine-grid">${rows.map(row => `<div><span>${row.label}</span><p>${row.description}</p></div>`).join('')}</div>`
          : `<div class="table-scroll"><table><thead><tr>${guide.headers.map(header => `<th scope="col">${esc(header)}</th>`).join('')}</tr></thead><tbody>${guide.rows.map(row => `<tr>${row.map((cell, i) => i ? `<td>${esc(cell)}</td>` : `<th scope="row">${esc(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<div class="article-chart"><h3>${esc(guide.title)}</h3>${content}${guide.note ? `<p class="chart-note">${esc(guide.note)}</p>` : ''}</div>`;
}

function substantiveWords(a, e, b) {
  const text = [a.quick, a.intro, ...a.sections.flat(), ...a.faq.flat(), ...e.sections.flat(), e.structureTitle, ...e.structure.flat(), b?.heading || '', ...(b?.selected || [])].join(' ');
  return text.trim().split(/\s+/).length;
}

const report = [];
for (const a of articles) {
  if (a.added) {
    const file = path.join(root, a.category, a.slug, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const detailName = `articles/${a.slug}-detail.jpg`;
    if (!fs.existsSync(path.join(root, 'assets', 'images', detailName))) throw new Error(`Missing new article detail image: ${a.slug}`);
    const sectionStart = html.indexOf('<section id="section-2">');
    const sectionEnd = html.indexOf('</section>', sectionStart);
    if (sectionStart < 0 || sectionEnd < 0) throw new Error(`Cannot place new article image: ${a.slug}`);
    const figure = `<figure class="article-inline"><img src="../../assets/images/${detailName}" alt="${esc(a.detailAlt)}" width="1536" height="1024" loading="lazy"><figcaption>${esc(a.imageCaption)}</figcaption></figure>`;
    html = html.slice(0, sectionEnd + 10) + figure + html.slice(sectionEnd + 10);
    if (a.chart) html = appendToSection(html, 'section-3', visualGuide(a.chart));
    const related = relatedArticles(a, articles);
    const links = `<section class="more-guides"><h3>Continue exploring</h3><p>For a broader routine, read ${related.map((x, i) => `<a href="../../${x.category}/${x.slug}/">${esc(x.title)}</a>${i === related.length - 1 ? '.' : i === related.length - 2 ? ', and ' : ', '}`).join('')}</p></section>`;
    html = html.replace('<section id="faq"', links + '<section id="faq"');
    if (a.sources?.length) {
      const sources = `<section class="article-sources"><h3>Editorial references</h3><p>These resources informed the general guidance in this article. They do not replace advice tailored to your pet.</p><ul>${a.sources.map(([label, url]) => `<li><a href="${esc(url)}">${esc(label)}</a></li>`).join('')}</ul></section>`;
      html = html.replace('<p class="editor-note">', sources + '<p class="editor-note">');
    }
    const schemaMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    if (!schemaMatch) throw new Error(`Missing schema: ${a.slug}`);
    const schema = JSON.parse(schemaMatch[1]);
    schema.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map(([name, answer]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text: answer } })) });
    html = html.replace(schemaMatch[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    fs.writeFileSync(file, html);
    const chartText = a.chart ? [a.chart.title, ...(a.chart.headers || []), ...a.chart.rows.flat()].join(' ') : '';
    const words = [a.quick, a.intro, ...a.sections.flat(), ...a.faq.flat(), a.imageCaption, chartText].join(' ').trim().split(/\s+/).length;
    report.push({ slug: a.slug, words, format: a.chart?.kind || 'prose', images: 2, metaLength: a.metaDescription.length, titleLength: (a.metaTitle || a.title).length + ' | Paw Care Post'.length });
    continue;
  }
  const e = bySlug.get(a.slug);
  if (!e) throw new Error(`Missing expansion: ${a.slug}`);
  if (e.sections.length < 3 || e.structure.length < 3) throw new Error(`Incomplete expansion: ${a.slug}`);
  const b = bridges[a.slug];
  if (!b) throw new Error(`Missing practical section: ${a.slug}`);
  b.selected = [];
  for (const paragraph of b.paragraphs) {
    if (substantiveWords(a, e, b) >= 1010) break;
    b.selected.push(paragraph);
  }
  if (substantiveWords(a, e, b) < 1000 && finishing[a.slug]) b.selected.push(finishing[a.slug]);
  const extra = depth[a.slug];
  const finish = finalDepth[a.slug];
  if (!extra || extra.length < 5 || !finish) throw new Error(`Missing long-form article content: ${a.slug}`);
  const guide = visualGuides[a.slug];
  const countWords = value => value.trim().split(/\s+/).length;
  const guideText = guide ? [guide.title, ...(guide.kind === 'steps' ? [] : guide.headers), ...guide.rows.flat(), guide.note || ''].join(' ') : '';
  const words = substantiveWords(a, e, b) + countWords([...extra, finish].join(' ')) + (guide ? countWords(guideText) : 0);
  const file = path.join(root, a.category, a.slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const bridgeHtml = b.selected.length ? `<section id="practical" class="deep-section"><h3>${esc(b.heading)}</h3>${b.selected.map(p => `<p>${esc(p)}</p>`).join('')}</section>` : '';
  html = html.replace('<section id="faq"', deepDive(e) + bridgeHtml + '<section id="faq"');
  const placements = ['section-1', 'section-2', 'section-3', 'section-4', ...(extra.length === 6 ? ['deep-2'] : []), 'deep-3'];
  extra.forEach((text, i) => { html = appendToSection(html, placements[i], paragraphs(text)); });
  html = appendToSection(html, 'deep-3', paragraphs(finish));
  if (guide) html = appendToSection(html, 'section-3', visualGuide(guide));
  const [fallbackName, fallbackAlt] = categoryImages[a.category];
  const detailName = `articles/${a.slug}-detail.jpg`;
  const inlineName = fs.existsSync(path.join(root, 'assets', 'images', detailName)) ? detailName : fallbackName;
  const inlineAlt = inlineName === detailName ? detailAlts[a.slug] : fallbackAlt;
  const start = html.indexOf('<section id="section-2">');
  const end = html.indexOf('</section>', start);
  if (start < 0 || end < 0) throw new Error(`Cannot place inline image: ${a.slug}`);
  const figure = `<figure class="article-inline"><img src="../../assets/images/${inlineName}" alt="${esc(inlineAlt)}" width="1536" height="1024" loading="lazy"><figcaption>${esc(e.imageCaption)}</figcaption></figure>`;
  html = html.slice(0, end + 10) + figure + html.slice(end + 10);
  const related = relatedArticles(a, articles);
  const links = `<section class="more-guides"><h3>Continue exploring</h3><p>For a broader routine, read ${related.map((x, i) => `<a href="../../${x.category}/${x.slug}/">${esc(x.title)}</a>${i === related.length - 1 ? '.' : i === related.length - 2 ? ', and ' : ', '}`).join('')}</p></section>`;
  html = html.replace('<section id="faq"', links + '<section id="faq"');
  const articleSources = [...(e.sources || []), ...(sourceExtras[a.slug] || [])];
  if (articleSources.length) {
    const sources = `<section class="article-sources"><h3>Editorial references</h3><p>These resources informed the general guidance in this article. They do not replace advice tailored to your pet.</p><ul>${articleSources.map(([label, url]) => `<li><a href="${esc(url)}">${esc(label)}</a></li>`).join('')}</ul></section>`;
    html = html.replace('<p class="editor-note">', sources + '<p class="editor-note">');
  }
  if (e.meta) html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(e.meta)}">`).replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(e.meta)}">`).replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(e.meta)}">`);
  if (e.seoTitle) html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(e.seoTitle)} | Paw Care Post</title>`).replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(e.seoTitle)} | Paw Care Post">`).replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(e.seoTitle)} | Paw Care Post">`);
  const schemaMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  if (schemaMatch) {
    const schema = JSON.parse(schemaMatch[1]);
    schema.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) });
    html = html.replace(schemaMatch[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  }
  fs.writeFileSync(file, html);
  report.push({ slug: a.slug, words, format: e.format || formats[articles.indexOf(a) % formats.length], images: 2, metaLength: (e.meta || a.excerpt).length, titleLength: (e.seoTitle || a.title).length + ' | Paw Care Post'.length });
}

const indexFile = path.join(root, 'assets', 'search-index.js');
let indexSource = fs.readFileSync(indexFile, 'utf8');
const search = JSON.parse(indexSource.replace(/^window\.PAW_SEARCH_INDEX=/, '').replace(/;$/, ''));
for (const hit of search) { const slug = hit.url.split('/').filter(Boolean).at(-1); const e = bySlug.get(slug); const b = bridges[slug]; if (e) hit.text += ' ' + [e.sections.flat().join(' '), e.structure.flat().join(' '), ...(b?.selected || [])].join(' ').toLowerCase(); }
fs.writeFileSync(indexFile, 'window.PAW_SEARCH_INDEX=' + JSON.stringify(search) + ';');
fs.writeFileSync(path.join(sourceDir, 'pawcarepost-content-report.json'), JSON.stringify(report, null, 2));
console.log(`Enhanced ${report.length} articles; word range ${Math.min(...report.map(x => x.words))}-${Math.max(...report.map(x => x.words))}.`);
if (report.some(x => x.words < 2000 || x.words > 2300)) process.exitCode = 2;
