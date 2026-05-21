import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = Object.freeze([
  { path: "index.html", slug: "overview", label: "概要" },
  { path: "phase.html", slug: "phase", label: "位相" },
  { path: "world.html", slug: "world", label: "世界" },
  { path: "htof.html", slug: "htof", label: "hTOF" },
  { path: "formulas.html", slug: "formulas", label: "式と表" }
]);

test("dashboard is split into stable learning pages", async () => {
  for (const page of pages) {
    const html = await readFile(new URL(`../${page.path}`, import.meta.url), "utf8");

    assert.match(html, new RegExp(`<body[^>]+data-page="${page.slug}"`));
    assert.match(html, /<nav class="main-nav"/);
    assert.match(html, /<script type="module" src="\.\/src\/app\.js"><\/script>/);
    assert.match(html, /<main class="shell">/);
    assert.match(html, /<h1>/);
  }
});

test("every page links to every other top-level dashboard page", async () => {
  for (const page of pages) {
    const html = await readFile(new URL(`../${page.path}`, import.meta.url), "utf8");

    for (const target of pages) {
      assert.match(html, new RegExp(`href="\\./${target.path}"[^>]*>${target.label}</a>`));
    }
  }
});
