import { z } from "zod";
import { accountsSyncModule } from "@ledgerhq/live-wallet/accounts";
import { accountNamesSyncModule } from "@domain/entity-account-name";
import { contactsSyncModule } from "@domain/entity-contact";
import { recentAddressesSyncModule } from "@domain/entity-recent-addresses";

export const liveSchema = z.object({
  accounts: z.optional(accountsSyncModule.schema),
  accountNames: z.optional(accountNamesSyncModule.schema),
  contacts: z.optional(contactsSyncModule.schema),
  recentAddresses: z.optional(recentAddressesSyncModule.schema),
});

export type DistantState = z.infer<typeof liveSchema>;
export { liveSlug, trustchainLifecycle } from "@features/platform-wallet-sync";
