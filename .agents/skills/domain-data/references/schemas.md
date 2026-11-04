# Zod schemas: validators and query arguments

Details behind the entity part of [`domain-data`](../SKILL.md). The repo runs Zod 4 (`zod` in the
catalog of [`pnpm-workspace.yaml`](../../../../pnpm-workspace.yaml)): string formats are top-level
functions, and `z.string().uuid()` is the deprecated Zod 3 form.

## Validators

| Need | Use | Precedent |
| --- | --- | --- |
| A fixed set of strings | `z.enum([...])` | `PortfolioAccountStatusSchema` in [`account-portfolio/src/schema.ts`](../../../../domain/api/account-portfolio/src/schema.ts) |
| One of several shapes | `z.union([...])` | `BalanceGroupSchema` in the same file, `RawQuoteApiSchema` in [`swap-quotes/src/schema.ts`](../../../../domain/api/swap-quotes/src/schema.ts) |
| An ISO date-time | `DateTimeIsoSchema`, which wraps `z.iso.datetime({ offset: true })` | [`shared/schema-primitives/src/string.ts`](../../../../shared/schema-primitives/src/string.ts) |
| A UUID | `z.uuid()` | `AccountAliasSchema` in [`account-alias/src/schema.ts`](../../../../domain/entity/account-alias/src/schema.ts) |
| An email | `z.email()` | none yet |
| A length or a range | `.min()`, `.max()` | `ContactNameSchema` in [`contact/src/schema.ts`](../../../../domain/entity/contact/src/schema.ts) |

Reach for `z.enum` before a `z.union` of `z.literal`s: it gives the same type and exposes
`.options`.

## Query arguments

Type the argument of `build.query<Result, Arg>` in the api package's `types.ts`, as a plain `type`
(`PortfolioParams` in
[`account-portfolio/src/types.ts`](../../../../domain/api/account-portfolio/src/types.ts)). When a
schema already describes the argument, infer it instead of restating it (`ResolvedQuotesInput`, the
`z.infer` of `ResolvedQuotesInputSchema` in
[`swap-quotes/src/types.ts`](../../../../domain/api/swap-quotes/src/types.ts)). `void` means no
argument.
