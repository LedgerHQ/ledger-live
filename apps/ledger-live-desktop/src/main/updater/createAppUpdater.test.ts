import { UpdateIncorrectHash, UpdateIncorrectSig } from "../../errors";
import createAppUpdater, { type UpdateFile } from "./createAppUpdater";

const LEDGER_KEY = "ledger-key";
const ZIP: UpdateFile = {
  filename: "ledger-live-desktop-9.9.9-mac.zip",
  sha512Hex: "a".repeat(128),
};
const DMG: UpdateFile = {
  filename: "ledger-live-desktop-9.9.9-mac.dmg",
  sha512Hex: "b".repeat(128),
};
const HASH_FILE = [ZIP, DMG].map(file => `${file.sha512Hex}  ${file.filename}\n`).join("");

jest.mock("./sslHelper", () => ({
  verify: async (message: string, signature: Buffer, pubKey: string) => {
    if (!signature.equals(mockSign(message, pubKey))) throw new Error("Invalid signature");
  },
  getFingerprint: async (pubKey: string) => `${pubKey}-fingerprint`,
}));

describe("createAppUpdater", () => {
  it("should accept an update when the signed hash file lists all its files", async () => {
    await expect(verifyUpdate([ZIP, DMG])).resolves.toBeUndefined();
  });

  it("should reject an update when one of its files is missing from the hash file", async () => {
    const appImage = {
      filename: "ledger-live-desktop-9.9.9-linux-x86_64.AppImage",
      sha512Hex: "c".repeat(128),
    };

    await expect(verifyUpdate([ZIP, appImage])).rejects.toThrow(UpdateIncorrectHash);
  });

  it("should reject an update when a file hash differs from the hash file", async () => {
    await expect(verifyUpdate([ZIP, { ...DMG, sha512Hex: "c".repeat(128) }])).rejects.toThrow(
      UpdateIncorrectHash,
    );
  });

  it("should reject an update when a file has no hash", async () => {
    await expect(verifyUpdate([{ filename: "unlisted.zip", sha512Hex: "" }])).rejects.toThrow(
      UpdateIncorrectHash,
    );
  });

  it("should reject an update when it has no files", async () => {
    await expect(verifyUpdate([])).rejects.toThrow(UpdateIncorrectHash);
  });

  it("should reject an update when the hash file is signed with another key", async () => {
    await expect(verifyUpdate([ZIP], "other-key")).rejects.toThrow(UpdateIncorrectSig);
  });
});

function verifyUpdate(files: UpdateFile[], signingKey = LEDGER_KEY) {
  return createAppUpdater({
    files,
    getHashFile: async () => HASH_FILE,
    getHashFileSignature: async () => mockSign(HASH_FILE, signingKey),
    getNextKey: async fingerprint => {
      if (fingerprint) throw new Error(`No key after ${fingerprint}`);
      return LEDGER_KEY;
    },
    getNextKeySignature: async fingerprint => {
      throw new Error(`No signature for the key after ${fingerprint}`);
    },
  }).verify();
}

function mockSign(message: string, key: string) {
  return Buffer.from(`${key}:${message}`);
}
