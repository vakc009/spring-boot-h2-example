---
name: test-agent
description: Detects and repairs unit tests affected by business logic changes. Use when the user asks to add, fix, or update unit tests after source code changes, or says "use test-agent".
---

# Test-Agent Skill: Detect & Repair Affected Unit Tests

Purpose
- Define a reproducible, safe process for an automated agent to detect which unit tests are affected when business logic changes, list them, and either update or add tests to cover edge cases introduced by the change.
- Provide concrete commands, heuristics, and safety rules so automated agents ("claude" or similar) can act like a responsible maintainer.

Goals / Success criteria
- Produce a prioritized list of affected tests for any code change.
- Auto-generate or update unit tests where safe and unambiguous to do so.
- Ensure the project builds and test suite passes after the agent's changes.
- Never silently modify business logic; only adapt tests when logic changes were intentional.

Assumptions
- Project uses Maven (`pom.xml`) and the existing test framework (JUnit 5 in this repo).
- Agent has access to the Git repository (branch/commit) it is operating on.
- Agent can run Maven commands locally on a Windows runner (cmd.exe) using `./mvnw.cmd`.

High-level algorithm (steps the agent will follow)
1. Scope the change
   - Determine the commit(s) or working tree diff to analyze (e.g., `git diff --name-only origin/main...HEAD`).
   - Identify changed Java files and their fully-qualified class names.

2. Run the baseline test suite
   - Run full tests to get a clean baseline and capture current failures (if any).
   - Command (Windows):
```cmd
./mvnw.cmd -B -DskipTests=false test
```
   - Record failing tests and test reports (target/surefire-reports or surefire-summary).

3. Determine candidate affected tests
   - Static mapping: use simple heuristics to map changed classes to test classes by naming conventions (e.g., `Xxx` -> `XxxTest`, `XxxTests`) and package mirrors.
   - Dynamic mapping (recommended): use coverage to map changed lines to tests that executed them. Configure JaCoCo to collect coverage per-test (line-level if possible) and then analyze which tests exercised the changed lines.
   - Fallback: run the test suite with test-impact analysis (run each test or use binary search selection) to find tests whose outcomes flip between runs.

4. Prioritize the candidate list
   - Tests that fail after the change are highest priority.
   - Tests that cover changed lines (via coverage) are next.
   - Tests in same package or with direct references to changed classes are also relevant.

5. Attempt automated fixes / additions
   - If a failing test is due to expected intentional behavior change (documented in PR/commit message), update the test assertions accordingly.
   - If failing tests reveal missing edge-case coverage, auto-generate new tests that assert the desired new behavior.
   - When generating tests, prefer explicit parameterized tests or a small set of unit tests covering boundary cases.
   - Use existing test utilities in the repo and follow the repository's style and naming conventions.

6. Re-run tests and iterate
   - After changes, run `./mvnw.cmd -DskipTests=false test` again and ensure all tests pass.
   - If failures persist, create a concise report and stop automated edits (escalate to maintainers).

7. Commit and open PR (automated or draft)
   - Include a changelog: list of changed files, list of affected tests, rationale for test updates, and commands used to validate.
   - If the agent cannot conclusively fix failing tests, produce a draft PR with failing tests and a detailed reproduction to allow maintainers to triage.

Practical implementation details

- Coverage-based impacted test detection (recommended)
  - Add JaCoCo Maven plugin to `pom.xml` with per-test coverage. If not possible, run per-test coverage by executing tests individually or in small batches.
  - Produce a mapping: changed file -> list of tests that executed those lines.

- Fallback binary search selection
  - If coverage is unavailable, identify affected tests by running the subset of tests (or whole suite) and checking which tests fail.
  - To reduce runtime, use a hierarchical binary search across test classes.

- Test generation & templates
  - Create test templates that the agent can fill using simple heuristics:
    - Happy path test
    - Null/empty input tests
    - Boundary value tests (min/max/zero/one)
    - Exception path tests (invalid arg, missing dependency)
  - Example test file naming: `ClassName_<scenario>_Test.java` or `ClassNameTest` for grouped cases.

Safety rules and policies (must be enforced by the agent)
- Never change production/business logic unless a maintainer-approved commit/PR explicitly requested it. If tests fail but business logic was not intended to change, the agent must open an issue or PR describing the failures — do not silently mutate logic.
- If changing tests to match changed behavior, the agent must include the commit/PR message and reference to the original change (commit id or PR id) and include a description of why the test was updated.
- Do not introduce external secrets, credentials, or environment-specific changes in tests.
- If automatic repair cannot be done deterministically (ambiguous expected behavior), create a draft PR and stop.

Edge case checklist (for adding tests)
- Null inputs and optional values
- Empty collections and strings
- Boundary numeric values (min, max, zero, -1 when relevant)
- Concurrent access and race conditions (if code is multi-threaded/reactive)
- Reactive-specific checks: non-blocking behavior, proper usage of Mono/Flux, no subscribeOn/parallel leaks
- Error and exception paths (invalid arg, repository errors, upstream failures)
- Transactional behavior and rollback semantics
- Resource cleanup (streams, connections)

Quality gates for agent changes
- Build must succeed: `./mvnw.cmd -q -DskipTests=false package`
- All unit tests must pass locally.
- New or updated tests must include clear assertions and minimal setup.
- Commit messages include a short summary and a description of changes plus test evidence (commands run and results).

Commands and examples (Windows - cmd.exe)
- Run full tests:
```cmd
.\\mvnw.cmd -B -DskipTests=false test
```
- Run a single test class:
```cmd
.\\mvnw.cmd -Dtest=com.bezkoder.spring.r2dbc.h2.TutorialServiceTest test
```
- Run Maven with JaCoCo to produce coverage (requires plugin in pom):
```cmd
.\\mvnw.cmd clean test jacoco:report
```

Automation scaffolding suggestions (repo changes)
- Add a `scripts/` folder with helper scripts the agent can call (for Windows: `.cmd` files) that encapsulate common operations (run one test, collect coverage, map changed lines to tests).
- Add JaCoCo to the project to enable accurate test-impact mapping.
- Add a `./.claude/skills/test-agent/SKILL.md` (this file) and optionally a `test-agent` script that performs the algorithm.

Reporting format the agent should produce
- Summary (one paragraph): changed files, number of affected tests, action taken.
- Detailed list: for each changed file show the tests that cover changed lines, failing tests (before/after), and links to test reports.
- Patch details: files and tests changed by the agent.
- Validation steps to reproduce locally (commands and expected outcomes).

When to escalate to maintainers
- Agent cannot identify a safe test update.
- Tests still fail after two automated repair attempts.
- The expected behavior is ambiguous or requires domain knowledge.
- Fix requires updating external configuration or secrets.

Developer checklist to accept agent-created PRs
- Verify that the agent's tests are written in the project's style and use existing test utilities.
- Ensure commit messages and PR body explain why tests were added/updated.
- Run the test suite locally and double-check edge cases the agent covered.