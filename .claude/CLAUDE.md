# CLAUDE / Maintenance Guidelines for this Project

Purpose
- Provide a concise, high-level guide for maintaining the Spring Boot reactive example in this repository.
- This file documents architecture, development & run commands, quality gates, and explicit rules that any automated agent (including changes proposed by "claude" automation) must follow.

Scope
- Applies to all changes to this repository, especially those made by automated tooling or assistants.
- Human contributors should follow the same checklist and quality gates.

High-level architecture
- Framework: Spring Boot (Reactive)
- Data access: R2DBC (reactive) with H2 (in-memory) for the example.
- Package layout (key folders):
  - `com.bezkoder.spring.r2dbc.h2` — application root
  - `controller/` — HTTP/REST controllers (API layer)
  - `service/` — business logic and application services
  - `repository/` — reactive repositories (R2DBC interfaces)
  - `model/` — domain/data model objects
  - `resources/` — `application.properties`, schema (`schema.sql`) and other resource files

Design principles
- Keep controllers thin: map requests, validate inputs, call service layer.
- Keep service layer responsible for business rules and coordination between repositories.
- Repositories should be thin reactive interfaces (no blocking calls).
- Avoid blocking I/O on reactive threads. Use reactive APIs end-to-end.
- Favor immutability for model objects when practical.

Contract for changes (what to include with every change)
- Inputs: Git branch or PR containing source changes.
- Outputs: Buildable project, passing unit tests for modified functionality, and descriptive PR text.
- Error modes: Build failures, failing tests, or regressions in reactive behavior.
- Success criteria: `mvn -q -DskipTests=false test` (or `./mvnw.cmd test`) passes on CI and locally; project builds successfully.

Checklist for making a change (human or automated)
1. Create a feature branch named `feature/<short-description>` or `fix/<short-description>`.
2. Run unit tests locally: `./mvnw.cmd test` (Windows) from repo root.
3. Run the application locally (if needed): `./mvnw.cmd spring-boot:run` and test APIs.
4. If DB schema changes are required, update `src/main/resources/schema.sql` and add migration notes to the PR.
5. Update documentation (README or this file) for public-facing behavior changes.
6. Add or update unit tests for new logic and ensure reactive behavior is preserved.
7. Open a PR with a clear description, linked issue (if any), and testing steps.

Quality gates (automated and manual checks)
- Build: `./mvnw.cmd -q -DskipTests=false package` must succeed.
- Tests: All unit tests and integration tests added for the change must pass.
- Lint/Formatting: Follow the repository's Java formatting conventions. Use IDE formatting or a formatter plugin.
- Review: At least one approving review before merge (project-specific policy may require more).

Specifics for this demo project
- The example uses an in-memory H2 DB via `schema.sql` under `src/main/resources/` for quick runs.
- For persistent database testing or production, replace H2 config with a dedicated DB and add migration tooling (Flyway/Liquibase).
- Be explicit about any change that alters `application.properties` defaults (port, datasource configuration, logging levels).

When an automated agent ("claude") makes changes
- Always follow the full checklist above. Assume automation must act like a human contributor.
- Each automated change must include:
  - A clear commit message describing intent and files changed.
  - A description of tests run, and the results.
  - Confirmation that `./mvnw.cmd test` passed locally in the branch.
  - If tests cannot be executed (e.g., environment restrictions), state the exact reason and required follow-up.
- Never introduce secrets or credentials into the repository. If a change requires new secrets, create a task and do not commit them.

Developer guidance & best practices
- Prefer small, focused PRs for easier review.
- Keep the reactive chain unbroken: do not call blocking I/O in controller or service threads.
- For long-running work, use scheduler or dedicated thread pools outside reactive event loops.
- Name tests clearly: `should<Behavior>When<Condition>` or similar descriptive names.

Commit message template (recommended)
- Short summary (50 chars or less)
- Blank line
- Longer description explaining why the change was made and any migration steps.
- Footer with issue reference, e.g. `Fixes #123` (if applicable)

Useful commands (Windows)
- Run tests: `./mvnw.cmd test`
- Build package: `./mvnw.cmd -DskipTests=false package`
- Run app: `./mvnw.cmd spring-boot:run`

Next steps / improvements (optional)
- Add a CI workflow that enforces the quality gates above (build, tests). If CI isn't present, add a `.github/workflows/ci.yml` to run `./mvnw.cmd test` on PRs.
- Add a formatting/linting check to CI.

Requirements coverage
- High-level architecture: Done
- Maintenance instructions for changes made by claude/automations: Done

If you want, I can also:
- Add a sample GitHub Actions CI file to enforce these gates.
- Create a PR template or ISSUE template to standardize contributions.

---
(End of CLAUDE.md)

