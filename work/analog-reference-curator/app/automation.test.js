const assert = require("node:assert/strict");
const test = require("node:test");
const { buildWindowsTaskCommands } = require("./automation");

test("buildWindowsTaskCommands creates refresh and reminder schtasks commands", () => {
  const commands = buildWindowsTaskCommands("C:\\Projects\\analog-reference-curator");

  assert.equal(commands.length, 2);
  assert.match(commands[0], /Analog Reference Curator Refresh/);
  assert.match(commands[0], /\/ST 00:05/);
  assert.match(commands[0], /refresh\.js/);
  assert.match(commands[1], /Analog Reference Curator Reminder/);
  assert.match(commands[1], /\/ST 21:00/);
  assert.match(commands[1], /reminder\.js/);
});
