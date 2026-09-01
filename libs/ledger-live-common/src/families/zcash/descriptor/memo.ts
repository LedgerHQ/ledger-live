import { classifyZcashRecipient } from "@ledgerhq/coin-zcash/logic/address";
import type { InputDescriptor } from "../../../bridge/descriptor/types";

// ZIP-302 caps a shielded-output memo at 512 bytes, while `maxLength` caps characters.
// The byte budget is enforced by coin-zcash's getTransactionStatus, which rejects a
// multi-byte memo that fits in 512 characters but not in 512 bytes.
export const memo: InputDescriptor = {
  type: "text",
  maxLength: 512,
  // A memo travels inside the shielded output that pays the recipient, so only an
  // Orchard receiver can be handed one -- paying a transparent address builds no
  // shielded output at all. This mirrors the legacy send flow, which showed the
  // memo field only for `recipientType === "private"`.
  appliesToRecipient: recipient => {
    const cls = classifyZcashRecipient(recipient);
    return "recipientType" in cls && cls.recipientType === "private";
  },
};
