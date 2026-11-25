import { AccountContextSchema, type AccountContext } from "./schema";

/** An Aleo account's view key unless overridden. */
export function mockAccountContext(overrides: Partial<AccountContext> = {}): AccountContext {
  return AccountContextSchema.parse({ viewKey: "AViewKey1mockViewKey", ...overrides });
}
