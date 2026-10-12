# Paw Care Post source files

This folder collects the article data, legal copy, image records, generation scripts, and QA files for Paw Care Post. The previewable static website remains one level up at `../index.html`; its HTML, CSS, JavaScript, and final images are self-contained. Visitors do not need these source files or a build step to view the site.

The generator and QA scripts are for future editorial maintenance by Codex. Run them in this order when content changes:

```text
node pawcarepost-generator.mjs
node pawcarepost-enhance.mjs
node pawcarepost-qa.mjs
```

They locate the website and source data relative to their own files, so the working directory does not matter. Image conversion scripts are historical asset preparation helpers; the final JPEG assets already live in `../assets/images/articles/`.
