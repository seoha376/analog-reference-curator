const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const source = fs.readFileSync("app/CuratorBoard.tsx", "utf8");

test("mobile board keeps UI cues inside a collapsible details section", () => {
  assert.match(source, /<details className="cue-details">/);
  assert.match(source, /<summary>UI cues<\/summary>/);
  assert.ok(source.indexOf('<details className="cue-details">') < source.indexOf('<div className="chips">'));
  assert.ok(source.indexOf('<div className="chips">') < source.indexOf("</details>"));
});
