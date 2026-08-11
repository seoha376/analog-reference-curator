const assert = require("node:assert/strict");
const test = require("node:test");
const { buildReminderDecision } = require("./reminder");

test("buildReminderDecision skips when today is reviewed", () => {
  const decision = buildReminderDecision(
    { date: "2026-08-12", reviewed: true },
    "2026-08-12",
    5
  );

  assert.deepEqual(decision, {
    shouldSend: false,
    reason: "already-reviewed",
    message: "",
    email: null
  });
});

test("buildReminderDecision sends when today is not reviewed", () => {
  const decision = buildReminderDecision(
    { date: "2026-08-12", reviewed: false },
    "2026-08-12",
    5
  );

  assert.equal(decision.shouldSend, true);
  assert.equal(decision.reason, "review-needed");
  assert.match(decision.message, /5 analog references/);
  assert.match(decision.message, /REVIEW ON/);
  assert.equal(decision.email.to, "me");
  assert.match(decision.email.subject, /Analog references need review/);
  assert.match(decision.email.body, /http:\/\/127\.0\.0\.1:4173\//);
});

test("buildReminderDecision sends when review state is stale", () => {
  const decision = buildReminderDecision(
    { date: "2026-08-11", reviewed: true },
    "2026-08-12",
    3
  );

  assert.equal(decision.shouldSend, true);
  assert.equal(decision.reason, "stale-review-state");
});
