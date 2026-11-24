import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import pkg from "../../package.json" with { type: "json" };
import {
  clearUpdaterCache,
  feedBinaryName,
  installBinary,
  openApp,
  platformBuild,
  readTopLevelYamlValue,
} from "./utils/builds.mts";
import { generatePrivateKey, parsePrivateKey, signLowS } from "./utils/crypto.mts";
import { serveFeed } from "./utils/serveFeed.mts";

const downloadsUrl = "https://download.live.ledger.com";
const signaturesUrl = "https://lw-prerelease-sigs.s3.eu-west-1.amazonaws.com";
const preprodDir = path.resolve(import.meta.dirname, "..", "..", "dist", "preprod");
const signaturesDir = path.join(preprodDir, "signatures");

const {
  values,
  positionals: [buildName],
} = parseArgs({
  allowPositionals: true,
  options: { "bad-signature": { type: "boolean", default: false } },
});
if (!buildName) {
  throw new Error(
    `Pass the name of a build on ${downloadsUrl}, like ${feedBinaryName("<version>")}`,
  );
}

const signatureFeedUrl = await serveSignatures(values["bad-signature"]);
const build = path.join(preprodDir, buildName);
fs.mkdirSync(preprodDir, { recursive: true });
// The AppImage runs from this file.
fs.writeFileSync(build, await download(`${downloadsUrl}/${buildName}`), { mode: 0o755 });
const installedApp = await installBinary(build);
// A download left by an earlier run would spare the app downloading the update.
clearUpdaterCache();
openApp(installedApp, { UPDATE_CHECK_FEED: signatureFeedUrl });

// Serves the hash file and signature of the next update, like the prerelease signature feed.
async function serveSignatures(badSignature: boolean) {
  const nextYml = path.basename(platformBuild().latestYml).replace("latest", "next");
  const nextVersion = readTopLevelYamlValue(
    (await download(`${downloadsUrl}/${nextYml}`)).toString(),
    "version",
  );
  const hashFileName = `${pkg.name}-${nextVersion}.sha512sum`;
  const hashFile = await download(`${signaturesUrl}/${hashFileName}`);
  const signature = await download(`${signaturesUrl}/${hashFileName}.sig`);
  const ephemeralKey = parsePrivateKey(generatePrivateKey());
  fs.mkdirSync(signaturesDir, { recursive: true });
  fs.writeFileSync(path.join(signaturesDir, hashFileName), hashFile);
  fs.writeFileSync(
    path.join(signaturesDir, `${hashFileName}.sig`),
    badSignature ? signLowS(hashFile.toString(), ephemeralKey) : signature,
  );
  console.log(
    badSignature
      ? `Ledger Wallet must show an update error and not download ${nextVersion}`
      : `Ledger Wallet must download ${nextVersion} and install it on quit`,
  );
  return serveFeed({ dir: signaturesDir });
}

async function download(url: string) {
  console.log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
