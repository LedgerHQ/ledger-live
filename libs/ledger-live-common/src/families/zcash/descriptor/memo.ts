import type { InputDescriptor } from "../../../bridge/descriptor/types";

// ZIP-302 caps a shielded-output memo at 512 bytes. `maxLength` caps characters,
// so multi-byte input can still exceed the byte budget; the legacy field
// truncates on bytes (see apps/ledger-live-desktop/.../ZcashMemoField.tsx).
export const memo: InputDescriptor = {
  type: "text",
  maxLength: 512,
};
