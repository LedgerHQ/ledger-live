# Validation Before Finishing

Before finishing any agentic code change, add the following to your todo list:

- [ ] Run and fix linting issues
- [ ] Run unit and integration tests for the affected scope
- [ ] Run and pass typecheck
- [ ] When there are relevant dev or build tasks, run them to detect any issues

The commands you need to run depend on the scope of your changes. Refer to the local README.md files and package.json scripts for the correct commands. Fallback to [repo-commands](./repo-commands.md) for general guidance and gotchas.
