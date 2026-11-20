import type { AccountRedaction } from "@devtools/bindings";
import {
  redactAccountId,
  redactDescriptorKey,
} from "@ledgerhq/live-common/account/accountDescriptor";

export const accountRedaction: AccountRedaction = {
  descriptor: redactDescriptorKey,
  accountId: redactAccountId,
};
