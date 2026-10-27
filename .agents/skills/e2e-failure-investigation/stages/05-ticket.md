# 05 Ticket

Input: findings, domain Jira settings, investigation input policy. Output: ticket fields and `causes.json`.

1. **Gate:** if `policy.jira_write_approved` is not exactly `true`, do not call `bug-ticket`, do not search Jira, do not gather attachment candidates, and add `Jira write approval was not granted` to each ticket-worthy finding's gaps. Continue to stage 06.
2. Group non-flaky findings by `cause_id`. Do not ticket `not_confirmed` findings.
3. With explicit approval, gather attachments only when a ticket is needed, then call `bug-ticket`. Pass `allow_create: false` unless the caller separately authorizes creation.
4. Record the result and update `causes.json`. A Jira write or attachment must be stated in the final report.
