import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = Object.freeze([
  { path: "index.html", slug: "overview", label: "概要" },
  { path: "phase.html", slug: "phase", label: "位相" },
  { path: "formulas.html", slug: "formulas", label: "式と表" },
  { path: "world.html", slug: "world", label: "世界" },
  { path: "htof.html", slug: "htof", label: "hTOF" }
]);

test("dashboard is split into stable learning pages", async () => {
  for (const page of pages) {
    const html = await readFile(new URL(`../${page.path}`, import.meta.url), "utf8");

    assert.match(html, new RegExp(`<body[^>]+data-page="${page.slug}"`));
    assert.match(html, /<nav class="main-nav"/);
    assert.match(html, /<script type="module" src="\.\/src\/app\.js"><\/script>/);
    assert.match(html, /<main class="shell">/);
    assert.match(html, /<h1>/);
    assert.match(html, /class="lesson-note"/);
    assert.match(html, /class="next-card"/);
    assert.match(html, /class="nav-hint"/);
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

test("navigation follows the beginner learning order", async () => {
  for (const page of pages) {
    const html = await readFile(new URL(`../${page.path}`, import.meta.url), "utf8");
    const navLabels = [...html.matchAll(/<a href="\.\/[^"]+">([^<]+)<\/a>/g)]
      .map((match) => match[1])
      .slice(0, pages.length);

    assert.deepEqual(navLabels, pages.map((target) => target.label));
  }
});

test("beginner explanations cover key concepts", async () => {
  const overview = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const phase = await readFile(new URL("../phase.html", import.meta.url), "utf8");
  const formulas = await readFile(new URL("../formulas.html", import.meta.url), "utf8");
  const world = await readFile(new URL("../world.html", import.meta.url), "utf8");
  const htof = await readFile(new URL("../htof.html", import.meta.url), "utf8");

  assert.match(overview, /iToFは、光を出して戻り光の遅れから距離を求める方式/);
  assert.match(phase, /位相とは、1周期を360度で表したときの戻り光のズレ/);
  assert.match(formulas, /<div><span>D<\/span><strong>距離<\/strong><\/div>/);
  assert.match(formulas, /一意範囲を超えると位相が折り返し/);
  assert.match(formulas, /30MHzまで上げると一意範囲は5m/);
  assert.match(world, /1回の撮像で、各画素が1つの距離値を持つ/);
  assert.match(world, /欠測なし<\/span><strong>光は必ず戻る/);
  assert.match(htof, /hTOFはhybrid Time-of-Flightの略/);
  assert.match(htof, /gate 3 は3m以上4m未満の区間/);
  assert.match(htof, /fine は「そのgate内の細かい割合」/);
  assert.match(phase, /変調 f は、光を1秒に何回点滅させるか/);
  assert.match(overview, /D=距離、φ=ズレ角/);
});
