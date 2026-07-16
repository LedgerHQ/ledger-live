import { encryptData } from "../../key-ring/crypto";
import { defineRingCryptoCommand } from "./shared";
import { trackRingEncrypt } from "../../analytics/ring-analytics";

export default defineRingCryptoCommand({
  name: "encrypt",
  description:
    "Encrypt data with a key from your Ledger Key Ring. Files via -i/-o, text via stdin/stdout.",
  keyDescription:
    "Key name used to derive a scoped encryption key (e.g. my-oss-project, openClaw-prod)",
  jsonRequiresOutMessage:
    "--output json requires --out <file>: binary ciphertext cannot be written as JSON to stdout.",
  transform: encryptData,
  transformSpinLabel: key => `Encrypting with key "${key}"…`,
  transformSuccess: bytes => `Encrypted (${bytes} bytes, AES-256-GCM)`,
  onFileWritten: (out, dest, bytes) => out.ringEncrypt({ dest, bytes }),
  track: (flags, newKey) =>
    trackRingEncrypt({
      inputSource: flags.input ? "file" : "stdin",
      outputDest: flags.out ? "file" : "stdout",
      newKey,
    }),
});
