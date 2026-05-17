# GStack Run: acme-signup-mp90n1a7

Customer: Acme
Contact: Sarah Chen
Repo: /Users/randyhaddad/Desktop/GBrain Hackathon/callstack/demo-app
Issue: This is Sarah from Acme. The mobile signup page hides the continue button after I type my email.
Business context: Enterprise customer escalation on the dedicated Acme FDE line. Use GBrain memory plus the caller report to scope the work.
GBrain memory hits: No prior hits found; using live customer signal as new memory.

## Loaded GStack Skills
- /investigate: Systematic debugging with root cause investigation. Four phases: investigate, analyze, hypothesize, implement. Iron Law: no fixes without root cause. Use when asked to "debug this", "fix this bug", "why is this broken", "investigate this error", or "root cause analysis". Proactively invoke this skill (do NOT debug directly) when the user reports errors, 500 errors, stack traces, unexpected behavior, "it was working yesterday", or is troubleshooting why something stopped working. (gstack)
- /plan-eng-review: Eng manager-mode plan review. Lock in the execution plan — architecture, data flow, diagrams, edge cases, test coverage, performance. Walks through issues interactively with opinionated recommendations. Use when asked to "review the architecture", "engineering review", or "lock in the plan". Proactively suggest when the user has a plan or design doc and is about to start coding — to catch architecture issues before implementation. (gstack) Voice triggers (speech-to-text aliases): "tech review", "technical review", "plan engineering review".
- /review: Pre-landing PR review. Analyzes diff against the base branch for SQL safety, LLM trust boundary violations, conditional side effects, and other structural issues. Use when asked to "review this PR", "code review", "pre-landing review", or "check my diff". Proactively suggest when the user is about to merge or land code changes. (gstack)
- /qa: Systematically QA test a web application and fix bugs found. Runs QA testing, then iteratively fixes bugs in source code, committing each fix atomically and re-verifying. Use when asked to "qa", "QA", "test this site", "find bugs", "test and fix", or "fix what's broken". Proactively suggest when the user says a feature is ready for testing or asks "does this work?". Three tiers: Quick (critical/high only), Standard (+ medium), Exhaustive (+ cosmetic). Produces before/after health scores, fix evidence, and a ship-readiness summary. For report-only mode, use /qa-only. (gstack) Voice triggers (speech-to-text aliases): "quality check", "test the app", "run QA".
- /ship: Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR. Use when asked to "ship", "deploy", "push to main", "create a PR", "merge and push", or "get it deployed". Proactively invoke this skill (do NOT push/PR directly) when the user says code is ready, asks about deploying, wants to push code up, or asks to create a PR. (gstack)

## Execution
- /investigate (Root-cause FDE) [complete]: Root cause / scope: Investigation scoped from caller report plus GBrain recall: Acme Enterprise tenant acme-demo; Enterprise customer escalation on the dedicated Acme FDE line. Use GBrain memory plus the caller report to scope the work.
- /plan-eng-review (Engineering manager) [complete]: low risk; approval recommended; acceptance criteria: The reported path is fixed as described by the customer.; GBrain work order contains customer, issue, account context, and acceptance criteria.; GStack run artifact shows investigate, review, QA, and approval-gated ship steps.; No regression in smoke test path relevant to the issue.
- /review (Production reviewer) [complete]: Generated a GStack work order for signup: This is Sarah from Acme. The mobile signup page hides the continue button after I type my email.
- /qa (QA lead) [complete]: QA plan ready from acceptance criteria: The reported path is fixed as described by the customer.; GBrain work order contains customer, issue, account context, and acceptance criteria.; GStack run artifact shows investigate, review, QA, and approval-gated ship steps.; No regression in smoke test path relevant to the issue.
- /ship (Release engineer) [skipped]: Ship is gated on customer/human approval; FieldStack will request APPROVE before deploy.

## Acceptance Criteria
- The reported path is fixed as described by the customer.
- GBrain work order contains customer, issue, account context, and acceptance criteria.
- GStack run artifact shows investigate, review, QA, and approval-gated ship steps.
- No regression in smoke test path relevant to the issue.