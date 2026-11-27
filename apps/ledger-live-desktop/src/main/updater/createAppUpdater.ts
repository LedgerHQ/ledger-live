import { UpdateIncorrectHash, UpdateIncorrectSig } from "../../errors";
import * as sslHelper from "./sslHelper";

type Opts = {
  files: UpdateFile[];
  getNextKey: (a?: string | null) => Promise<string>;
  getNextKeySignature: (a: string) => Promise<Buffer>;
  getHashFile: () => Promise<string>;
  getHashFileSignature: () => Promise<Buffer>;
};
export type UpdateFile = { filename: string; sha512Hex: string };
export default function createAppUpdater(opts: Opts): {
  verify: () => Promise<void>;
} {
  const { files, getNextKey, getNextKeySignature, getHashFile, getHashFileSignature } = opts;

  // main logic:
  // - fetch hashFile + its signature
  // - verify signature
  // - compare the hash of every update file with the hash file
  // throw if any step fail.
  async function verify() {
    const [hashFile, hashFileSignature, key] = await Promise.all([
      getHashFile(),
      getHashFileSignature(),
      getNextKey(),
    ]);
    await verifyHashFileSignature(hashFile, hashFileSignature, key);
    compareHashes(hashFile);
  }

  // every update file must have its hash in the hash file
  function compareHashes(hashFile: string) {
    if (files.length === 0) {
      throw new UpdateIncorrectHash();
    }
    for (const { filename, sha512Hex } of files) {
      if (!sha512Hex || extractHashFromHashFile(hashFile, filename) !== sha512Hex) {
        throw new UpdateIncorrectHash(sha512Hex);
      }
    }
  }

  // verify hash signature with given pubkey
  // if it fails, try to get next key and repeat
  // if no more key, throw
  async function verifyHashFileSignature(hash: string, sigContent: Buffer, pubKey: string) {
    try {
      await sslHelper.verify(hash, sigContent, pubKey);
    } catch {
      try {
        const nextPubKey = await getNextPubKey(pubKey);
        await verifyHashFileSignature(hash, sigContent, nextPubKey);
      } catch {
        throw new UpdateIncorrectSig();
      }
    }
  }

  // fetch the next pubkey based on the previous key fingerprint
  // also fetch signature, and verify against previous pubkey
  async function getNextPubKey(pubKey: string) {
    const fingerprint = await sslHelper.getFingerprint(pubKey);
    const nextPubKey = await getNextKey(fingerprint);
    const nextPubKeySignature = await getNextKeySignature(fingerprint);
    await sslHelper.verify(nextPubKey, nextPubKeySignature, pubKey);
    return nextPubKey;
  }
  return {
    verify,
  };
}

// a hash file looks like: "<hash>  <filename>\n<hash>  <filename>"
// we only need the hash for the given filename
function extractHashFromHashFile(hashFile: string, filename: string) {
  let hash;
  hashFile.split("\n").find(r => {
    const row = r.split(/\s+/);
    hash = row[1] === filename ? row[0] : "";
    return !!hash;
  });
  return hash;
}
