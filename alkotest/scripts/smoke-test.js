// Smoke test for index.html: runs the inline app script against a minimal DOM
// stub and drives a full flash pass, a quiz pass and the result screen.
//
//   deno run --allow-read scripts/smoke-test.js
//
// Optional — needs Deno. The app itself has no dependencies.

const pageUrl = new URL("../index.html", import.meta.url);
const html = await Deno.readTextFile(pageUrl);

const dataMatch = html.match(/<script type="application\/json" id="alkoflash-data">([\s\S]*?)<\/script>/);
const jsMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!dataMatch || !jsMatch) throw new Error("could not extract data/script blocks from index.html");

const rawData = dataMatch[1];
const appCode = jsMatch[1];
const DATA = JSON.parse(rawData);
const TOTAL = DATA.questions.length;
const COUNT = Object.fromEntries(
  DATA.categories.map((c) => [c.id, DATA.questions.filter((q) => q.category === c.id).length]),
);

// ---- DOM stub -------------------------------------------------------------

const listeners = { app: [], document: [] };

function makeEl(id) {
  return {
    id,
    _html: "",
    textContent: id === "alkoflash-data" ? rawData : "",
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; },
    addEventListener(type, fn) {
      if (id === "app" && type === "click") listeners.app.push(fn);
    },
    closest() { return null; },
  };
}

const els = { app: makeEl("app"), foot: makeEl("foot"), "alkoflash-data": makeEl("alkoflash-data") };

globalThis.document = {
  getElementById: (id) => els[id] ?? null,
  addEventListener: (type, fn) => { if (type === "keydown") listeners.document.push(fn); },
};

globalThis.window = { scrollTo() {} };

const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  },
});

// ---- harness --------------------------------------------------------------

new Function(appCode)();

const appHtml = () => els.app.innerHTML;

function click(dataset) {
  const trigger = { dataset, disabled: false };
  const event = { target: { closest: (sel) => (sel === "[data-action]" ? trigger : null) } };
  for (const fn of listeners.app) fn(event);
}

function press(key) {
  const event = {
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    preventDefault() {},
    target: { closest: () => null },
  };
  for (const fn of listeners.document) fn(event);
}

let passed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  passed += 1;
  console.log("  ok  " + msg);
}

// ---- setup screen ---------------------------------------------------------

assert(els.foot.textContent.includes(`${TOTAL} frågor`), "footer shows question count");
assert(appHtml().includes("Öva inför kunskapsprovet"), "setup screen renders");
assert(appHtml().includes(`Starta ${TOTAL} kort`), "default amount is every question");
assert(appHtml().includes('data-cat="alkoholpolitik"'), "category chips render");

click({ action: "cats-none" });
assert(appHtml().includes("Välj minst en kategori"), "empty selection disables start");
assert(appHtml().includes("disabled"), "start button is disabled");

click({ action: "cats-all" });
assert(appHtml().includes(`Starta ${TOTAL} kort`), "select-all restores full deck");

click({ action: "cats-none" });
click({ action: "toggle-cat", cat: "tillsyn" });
assert(appHtml().includes(`Starta ${COUNT.tillsyn} kort`), `single category count (tillsyn = ${COUNT.tillsyn})`);

click({ action: "set-amount", amount: "50" });
assert(appHtml().includes(`Starta ${COUNT.tillsyn} kort`), "amount larger than the pool falls back to the pool size");

click({ action: "set-amount", amount: "10" });
assert(appHtml().includes("Starta 10 kort"), "amount 10 applied");

// ---- flash pass -----------------------------------------------------------

click({ action: "start" });
let h = appHtml();
assert(h.includes("Kort 1 av 10"), "flash deck starts with 10 cards");
assert(h.includes("Visa svar"), "answer hidden initially");
assert(!h.includes("Lagrum"), "no law reference before reveal");
assert(h.includes("badge-tillsyn"), "card shows the category badge");

click({ action: "reveal" });
h = appHtml();
assert(h.includes("Lagrum"), "answer and law shown after reveal");
assert(h.includes("Kunde inte") && h.includes("Kunde"), "rating buttons shown");

press("2");
assert(appHtml().includes("Kort 2 av 10"), "keyboard rating advances");

press(" ");
assert(appHtml().includes("Lagrum"), "space reveals the answer");

for (let i = 0; i < 20; i += 1) {
  if (appHtml().includes("Visa svar")) click({ action: "reveal" });
  if (appHtml().includes('data-action="rate"')) {
    click({ action: "rate", rate: i % 3 === 0 ? "missed" : "got" });
  }
}

h = appHtml();
assert(h.includes("Per delområde"), "result screen renders");
assert(h.includes("Att repetera"), "missed questions listed");

const pct = Number((h.match(/class="score-num">(\d+)</) || [])[1]);
assert(Number.isFinite(pct) && pct >= 0 && pct <= 100, "percentage within 0-100");

const missed = (h.match(/Att repetera \((\d+)\)/) || [])[1];
click({ action: "retry-missed" });
assert(appHtml().includes(`Kort 1 av ${missed}`), `retry-missed deck has ${missed} cards`);

// ---- quiz pass ------------------------------------------------------------

click({ action: "quit" });
click({ action: "set-mode", mode: "quiz" });
click({ action: "set-amount", amount: "10" });
click({ action: "cats-all" });
click({ action: "start" });

h = appHtml();
assert((h.match(/data-action="pick"/g) || []).length === 4, "quiz shows 4 options");

click({ action: "pick", pos: "0" });
h = appHtml();
assert(h.includes("is-correct"), "correct option highlighted");
assert(h.includes("Lagrum"), "explanation shown after answering");
assert(h.includes("Nästa fråga") || h.includes("Visa resultat"), "next button shown");

click({ action: "next" });
assert(appHtml().includes("Kort 2 av 10"), "quiz advances");
press("2");
assert(appHtml().includes("is-correct"), "number keys answer in quiz");

for (let i = 0; i < 20; i += 1) {
  if (appHtml().includes('data-action="pick"')) click({ action: "pick", pos: "1" });
  if (appHtml().includes('data-action="next"')) click({ action: "next" });
}
assert(appHtml().includes("Per delområde"), "quiz reaches the result screen");

// ---- navigation & settings ------------------------------------------------

click({ action: "restart" });
press("Escape");
assert(appHtml().includes("Öva inför kunskapsprovet"), "escape returns to setup");

const saved = JSON.parse(store.get("alkoflash.v1"));
assert(saved.mode === "quiz", "mode persisted");
assert(saved.categories.length === DATA.categories.length, "categories persisted");

console.log(`\n${passed} checks passed.`);
