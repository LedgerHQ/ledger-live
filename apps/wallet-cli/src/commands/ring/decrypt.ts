import { decryptData } from "../../key-ring/crypto";
import { defineRingCryptoCommand } from "./shared";
import { trackRingDecrypt } from "../../analytics/ring-analytics";

export default defineRingCryptoCommand({
  name: "decrypt",
  description:
    "Decrypt data with a key from your Ledger Key Ring. Files via -i/-o, text via stdin/stdout.",
  keyDescription: "Key name used to derive the scoped decryption key (must match encrypt)",
  jsonRequiresOutMessage:
    "--output json requires --out <file>: binary plaintext cannot be written as JSON to stdout.",
  transform: decryptData,
  transformSpinLabel: key => `Decrypting with key "${key}"…`,
  transformSuccess: () => "Decrypted",
  onFileWritten: (out, dest) => out.ringDecrypt({ dest }),
  track: flags =>
    trackRingDecrypt({
      inputSource: flags.input ? "file" : "stdin",
      outputDest: flags.out ? "file" : "stdout",
    }),
});
