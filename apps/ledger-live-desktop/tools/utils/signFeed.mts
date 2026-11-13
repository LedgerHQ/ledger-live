import fs from "fs";
import path from "path";
import pkg from "../../package.json" with { type: "json" };
import { getPub, parsePrivateKey, sha512, signLowS } from "./crypto.mts";

const feedDir = path.resolve(import.meta.dirname, "..", "..", "dist", "feed");
const binaryName = new RegExp(`^${pkg.name}-(.+)-(?:mac|linux|win)[.-]`);

export function signFeed(privateKeyPem: string) {
  const privateKey = parsePrivateKey(privateKeyPem);

  for (const [version, binaries] of groupBinariesByVersion(feedDir)) {
    const hashFile = binaries
      .map(file => `${sha512(path.join(feedDir, file), "hex")}  ${file}\n`)
      .join("");
    const hashFilePath = path.join(feedDir, `${pkg.name}-${version}.sha512sum`);
    fs.writeFileSync(hashFilePath, hashFile);
    fs.writeFileSync(`${hashFilePath}.sig`, signLowS(hashFile, privateKey));
    console.log(`Signed ${version}: ${binaries.join(", ")}`);
  }

  console.log(`Public key:\n${getPub(privateKeyPem)}`);
}

function groupBinariesByVersion(dir: string) {
  const binariesByVersion = new Map<string, string[]>();
  for (const file of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    const version = binaryName.exec(file)?.[1];
    if (!version || file.endsWith(".blockmap")) continue;
    binariesByVersion.set(version, [...(binariesByVersion.get(version) ?? []), file]);
  }
  if (binariesByVersion.size === 0) {
    throw new Error(`No binaries in ${dir}, run tools/build.mts first`);
  }
  return binariesByVersion;
}
