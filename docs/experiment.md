# Code Trail pilot protocol

## Question

Does arranging code and changed hunks along explicit dependency/data-flow connections improve explanation and defect detection speed without sacrificing accuracy?

## Preparation

1. Pick one repository and four developers familiar with its language but unfamiliar with the selected changes.
2. Through read-only inspection, choose two historical changes spanning roughly 3–5 functions across 2–3 files. Each should require following a value/state across function boundaries and have a documented subsequent defect fix or regression test.
3. Establish answer keys from source and historical evidence before preparing presentations. Replace examples if ground truth is uncertain.
4. Create matched graph and linear fixtures. Provide identical code, hunks, relationship facts, and file/line references. Aim for 6–10 graph nodes. Keep call, value passing, state access, and type relationships distinct.
5. Keep subsequent fixes and answer keys separate from participant assets. Freeze example-specific scoring checkpoints and decision rules before sessions.

## Assignment

| Participant | First    | Second   |
| ----------- | -------- | -------- |
| 1           | A linear | B graph  |
| 2           | A graph  | B linear |
| 3           | B linear | A graph  |
| 4           | B graph  | A linear |

No participant sees the same example twice. The landing-page preview uses only the practice fixture to avoid prior exposure to a study example.

## Session procedure

- Use the same desktop setup and neutral orientation for all participants.
- Explain labels and navigation using the untimed, separate practice fixture.
- Run each task for up to 12 minutes. Use only supplied materials; provide no hints or correctness feedback.
- Ask for relevant dependencies, concrete input-to-output behavior, and any introduced defect (hunk, trigger, consequence). Require file/line evidence.
- Allow a short break between tasks. Do not show answers or scores during the break.
- Ask about preference and confusion only after both tasks.
- Export JSON, confirm that it contains both task records, then clear the local session for the next participant.

## Scoring worksheet

Use one row per task and score without presentation labels where practical.

```text
session_id,participant,example,order,dependency_score,flow_score,review_score,
unsupported_dependencies,false_positive_defects,valid_defect,elapsed_ms,
timed_out,interrupted,scorer_notes
```

For each question: 0 = wrong/missing; 1 = partly correct but missing essential evidence/behavior; 2 = correct and evidenced. Write the example-specific full-credit checkpoints before testing. Full-credit defect detection requires the hunk, trigger, and consequence.

Keep explanation and review results separate. Compare correctness first and time only alongside correctness. Do not count incorrect/incomplete submissions as speed wins. Keep timeouts and interrupted sessions visible rather than silently dropping them.

## Decision rules

- **Supports:** graph answers are equally accurate or better, valid defect detection is at least as good, and correct completion is approximately 20% faster, with the same direction of benefit on both examples.
- **Refutes this version:** graph is approximately 20% slower without accuracy gains, or explanation/review correctness is consistently worse without a compensating speed benefit.
- **Inconclusive:** small/mixed effects, too few correct answers for time comparison, ceiling/floor effects, or fixture/interface problems.

These are directional pilot thresholds, not statistical significance. Improvement only in explanation supports an explanation experience, not yet code review. Curated graph success also does not prove automated extraction will succeed.

## Report

Summarize selection criteria, example revisions, presentation parity, scores/timings/false positives, interruptions, participant feedback, limitations, and the decision to continue, revise, or stop this version.
