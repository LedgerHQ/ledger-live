# Validation Before Finishing

Before finishing any agentic code change, run the [validate-changes](../.agents/skills/validate-changes/SKILL.md) skill. Add its steps to your todo list:

- [ ] Format the changed files with `oxfmt`
- [ ] Lint, typecheck and test the affected scope with `nx affected`
- [ ] When the change touches `shared/`, `domain/`, `features/`, `support/`, `devtools/` or a `package.json`, run `pnpm lint:arch` and fix each code with the skill's fix guide
- [ ] When there are relevant dev or build tasks, run them to detect any issues

Local README.md files and package.json scripts take priority for package-specific commands. Fall back to [repo-commands](./repo-commands.md) for general guidance and gotchas.
