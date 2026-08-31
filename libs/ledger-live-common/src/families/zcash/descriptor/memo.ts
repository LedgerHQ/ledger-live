import type { InputDescriptor } from "../../../bridge/descriptor/types";

// ZIP-302 caps a shielded-output memo at 512 bytes, while `maxLength` caps characters.
// The byte budget is enforced by coin-zcash's getTransactionStatus, which rejects a
// multi-byte memo that fits in 512 characters but not in 512 bytes.
export const memo: InputDescriptor = {
  type: "text",
  maxLength: 512,
};
