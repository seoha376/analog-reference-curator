const path = require("path");
const fs = require("fs/promises");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");

function buildReminderDecision(reviewState, today, candidateCount) {
  if (reviewState.date === today && reviewState.reviewed) {
    return {
      shouldSend: false,
      reason: "already-reviewed",
      message: ""
    };
  }

  const reason = reviewState.date === today ? "review-needed" : "stale-review-state";
  return {
    shouldSend: true,
    reason,
    message: [
      `You have ${candidateCount} analog references waiting for review.`,
      "Open the local curator, mark KEEP/KILL/MAYBE, then switch REVIEW ON."
    ].join(" ")
  };
}

function todayKst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function runReminderCheck() {
  const [reviewState, candidates] = await Promise.all([
    readJson(path.join(DATA_DIR, "review-state.json")),
    readJson(path.join(DATA_DIR, "candidates.json"))
  ]);

  return buildReminderDecision(reviewState, todayKst(), candidates.length);
}

if (require.main === module) {
  runReminderCheck()
    .then((decision) => {
      console.log(JSON.stringify(decision, null, 2));
      process.exitCode = decision.shouldSend ? 2 : 0;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = {
  buildReminderDecision,
  runReminderCheck
};
