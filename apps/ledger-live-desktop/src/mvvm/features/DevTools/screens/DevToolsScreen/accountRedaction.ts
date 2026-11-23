import type { AccountRedaction } from "@devtools/bindings";
import { redactAccountId } from "@ledgerhq/live-common/account/accountDescriptor";

export const accountRedaction: AccountRedaction = {
  descriptor: descriptor => descriptor,
  accountId: redactAccountId,
};
