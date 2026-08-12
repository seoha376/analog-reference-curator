const path = require("path");

function buildWindowsTaskCommands(repoRoot) {
  const root = path.resolve(repoRoot);
  const refreshScript = path.join(root, "work", "analog-reference-curator", "app", "refresh.js");
  const reminderScript = path.join(root, "work", "analog-reference-curator", "app", "reminder.js");

  return [
    buildSchtasksCommand("Analog Reference Curator Refresh", "00:05", refreshScript),
    buildSchtasksCommand("Analog Reference Curator Reminder", "21:00", reminderScript)
  ];
}

function buildSchtasksCommand(name, time, scriptPath) {
  return [
    "schtasks",
    "/Create",
    "/F",
    "/SC DAILY",
    `/TN "${name}"`,
    `/ST ${time}`,
    `/TR "node ${scriptPath}"`
  ].join(" ");
}

if (require.main === module) {
  buildWindowsTaskCommands(path.resolve(__dirname, "..", "..", "..")).forEach((command) => {
    console.log(command);
  });
}

module.exports = {
  buildWindowsTaskCommands
};
