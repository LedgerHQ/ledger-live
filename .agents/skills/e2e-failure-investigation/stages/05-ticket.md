# 05 Ticket

Input: draft findings, the `jira` block of the domain pack. Output: `ticket` field on each finding, `causes.json` updated.

1. Group findings by `cause_id`. Handle each group once.
2. Skip `flaky` groups, unless their cause is shared with a failed test.
3. For a group that needs a ticket, gather attachments (see `bug-ticket`, section Gather attachments). Then call the `bug-ticket` skill with a request that follows its `ticket-request.schema.json`. Pass `domain_jira` from the domain pack.
4. `bug-ticket` returns an existing key (`known`), a new key (created by the agent) or no key (creation is off).
5. If it returns no key, keep the status and add "create ticket" to `user_actions`.
6. Update `causes.json`: ticket key, `first_seen`, `last_seen`, run count.
7. For a `not_confirmed` finding, do not create a ticket.
