---
name: slack-pr-message
description: Generate a formatted Slack message to share a pull request with the team. Use when the user asks to generate a Slack message for a PR, share a PR on Slack, or after creating a pull request.
---

# Slack PR Message

Generate a formatted Slack message to announce a pull request.

## Instructions

1. Determine the PR URL and short description from the current context (branch, PR title, or user input).
2. Determine the correct prefix based on impacted packages.
3. Output the formatted message.

See [/docs/dev/slack-pr-message.md](/docs/dev/slack-pr-message.md) for the message format and prefix rules.
