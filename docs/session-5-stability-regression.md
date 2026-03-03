# Session 5 Stability Regression B

Date: 2026-03-02
Scope: Death flow consistency, StartScene selector rules, and pause-menu gamepad behavior across hardware profiles.

## Instrumentation Mode

- Launch with URL flag: `?qaSession5=1`
- Press `F9` during gameplay to output/copy QA summary
- Use summary counters/events as evidence for this worksheet

## Manual + Hybrid Checklist

### A) Death Flow Repeatability

- [x] Trigger death flow repeatedly (5+ times)
- [x] Confirm delay transitions to `GameOverScene`
- [x] Confirm restart always returns to sector 1
- [x] Confirm no frozen state after restart

### B) StartScene + Pause Menu Input Rules

- [x] Re-test StartScene selector behavior (`Enter` + `A` works)
- [x] Confirm Start/Menu button does not select StartScene entries
- [x] Re-test pause menu navigation with left stick
- [x] Re-test pause resume/restart selections with gamepad

### C) Multi-Gamepad Profile Check

- [x] Profile 1 pass complete
- [x] Profile 2 pass complete (if available) (N/A if no second profile available)
- [x] Differences noted (if any) (none observed)

## QA Summary Paste

- Session 5 run completed with no blocking issues observed.

## Session 5 Exit Check

- [x] Death/restart flow is consistently correct
- [x] Menu interaction remains stable across input devices

Closeout note:

- Session 5 PASS.

## Issue Capture (if any)

- Title:
- Severity: P1 / P2 / P3
- Repro steps:
- Expected:
- Actual:
- Frequency:
