# Get PR Comments

Fetch and summarize review comments from the active pull request.

## Trigger

Need a concise, actionable summary of feedback on the active pull request.

## Workflow

1. Resolve the active PR for the current branch:
   ```bash
   gh pr view --json url,title,number
   ```

2. Fetch review and discussion comments:
   ```bash
   gh pr view --json reviews,comments
   gh pr review
   ```

3. Group feedback by severity and actionability.

4. Return a concise action list.

## Output

- Grouped feedback summary (by severity)
- Action list ordered by priority
- Open questions that still need clarification
