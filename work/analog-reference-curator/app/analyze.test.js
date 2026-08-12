const assert = require("node:assert/strict");
const test = require("node:test");
const { analyzeHtml } = require("./analyze");

test("analyzeHtml extracts colors fonts and density cues", () => {
  const analysis = analyzeHtml(`
    <html>
      <head>
        <style>
          body { color: #332f29; background: rgb(251, 248, 239); font-family: Georgia, serif; }
          .card { border-color: #d8cdbc; font-family: "Trebuchet MS", Arial, sans-serif; }
        </style>
      </head>
      <body>
        <nav><a>one</a><a>two</a><a>three</a></nav>
        <article><h1>Tiny Page</h1><p>Dense cute reference.</p><button>Keep</button></article>
        <section><span>tag</span><span>tag</span><span>tag</span><span>tag</span></section>
      </body>
    </html>
  `);

  assert.deepEqual(analysis.colors.slice(0, 3), ["#332f29", "#d8cdbc", "rgb(251, 248, 239)"]);
  assert.deepEqual(analysis.fontFamilies, ["Georgia, serif", "\"Trebuchet MS\", Arial, sans-serif"]);
  assert.equal(analysis.density, "compact");
  assert.match(analysis.summary, /3 colors/);
});
