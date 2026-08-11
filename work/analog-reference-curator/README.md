# Analog Reference Curator

Local web workflow for reviewing analog, cute, dense web UI references.

## Run

```powershell
npm run start
```

Open `http://127.0.0.1:4173/`.

## Daily Commands

```powershell
npm run refresh
npm run reminder
```

`refresh` preserves `KEEP` references, drops old non-kept candidates, adds five fresh seed candidates, and resets today's review state.

`reminder` prints JSON. Exit code `0` means no reminder is needed. Exit code `2` means an external automation can send the printed message.

## Windows Task Scheduler

Preview the commands:

```powershell
npm run automation:windows
```

Copy and run the printed `schtasks` commands only when you are ready to register the local schedule:

- `00:05` daily refresh
- `21:00` review reminder check

The reminder command intentionally does not send Gmail by itself yet. It creates a stable local decision point for a later Gmail connector or mail script.
