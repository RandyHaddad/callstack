# GStack Run: acme-reports-mp90amwr

Customer: Acme
Contact: Sarah Chen
Repo: /Users/randyhaddad/Desktop/GBrain Hackathon/callstack/demo-app
Issue: The export button is missing on the reports dashboard.
Business context: Enterprise customer escalation: CSV export was promised during onboarding and is blocking report handoff.

## Loaded GStack Skills
- /investigate: Systematic debugging with root cause investigation. Four phases: investigate, analyze, hypothesize, implement. Iron Law: no fixes without root cause. Use when asked to "debug this", "fix this bug", "why is this broken", "investigate this error", or "root cause analysis". Proactively invoke this skill (do NOT debug directly) when the user reports errors, 500 errors, stack traces, unexpected behavior, "it was working yesterday", or is troubleshooting why something stopped working. (gstack)
- /plan-eng-review: Eng manager-mode plan review. Lock in the execution plan — architecture, data flow, diagrams, edge cases, test coverage, performance. Walks through issues interactively with opinionated recommendations. Use when asked to "review the architecture", "engineering review", or "lock in the plan". Proactively suggest when the user has a plan or design doc and is about to start coding — to catch architecture issues before implementation. (gstack) Voice triggers (speech-to-text aliases): "tech review", "technical review", "plan engineering review".
- /review: Pre-landing PR review. Analyzes diff against the base branch for SQL safety, LLM trust boundary violations, conditional side effects, and other structural issues. Use when asked to "review this PR", "code review", "pre-landing review", or "check my diff". Proactively suggest when the user is about to merge or land code changes. (gstack)
- /qa: Systematically QA test a web application and fix bugs found. Runs QA testing, then iteratively fixes bugs in source code, committing each fix atomically and re-verifying. Use when asked to "qa", "QA", "test this site", "find bugs", "test and fix", or "fix what's broken". Proactively suggest when the user says a feature is ready for testing or asks "does this work?". Three tiers: Quick (critical/high only), Standard (+ medium), Exhaustive (+ cosmetic). Produces before/after health scores, fix evidence, and a ship-readiness summary. For report-only mode, use /qa-only. (gstack) Voice triggers (speech-to-text aliases): "quality check", "test the app", "run QA".
- /ship: Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR. Use when asked to "ship", "deploy", "push to main", "create a PR", "merge and push", or "get it deployed". Proactively invoke this skill (do NOT push/PR directly) when the user says code is ready, asks about deploying, wants to push code up, or asks to create a PR. (gstack)

## Execution
- /investigate (Root-cause FDE) [complete]: Root cause: Acme Enterprise was excluded by a Pro-only CSV export entitlement gate.
- /plan-eng-review (Engineering manager) [complete]: Low code blast radius; customer impact is high because CSV export was promised during onboarding.
- /review (Production reviewer) [complete]: Export entitlement was already fixed for Pro and Enterprise.
- /qa (QA lead) [complete]: Static QA passed: Enterprise is included in the export entitlement gate.
- /ship (Release engineer) [skipped]: Ship is gated on customer/human approval; FieldStack will request APPROVE before deploy.

## Acceptance Criteria
- Export button is visible on the reports dashboard
- Export button functions correctly