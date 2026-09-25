// Client presets used to fetch the production Remote Config.
// Each preset impersonates one Firebase app, with a fixed installation ID (fid)
// so that repeated runs reuse the same installation and stay in the same
// percent-rollout bucket instead of registering a new installation every day.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ID = "ledger-live-production";
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));

function readDotEnv(file) {
  const entries = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map(line => line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/))
    .filter(Boolean)
    .map(match => [match[1], match[2]]);
  return Object.fromEntries(entries);
}

function readPlistString(file, key) {
  const match = fs
    .readFileSync(file, "utf8")
    .match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`));
  if (!match) throw new Error(`${key} not found in ${file}`);
  return match[1];
}

const mobileVersion = root =>
  readJson(path.join(root, "apps/ledger-live-mobile/package.json")).version;

export const PRESETS = [
  {
    name: "lwd",
    resolve(root) {
      const env = readDotEnv(path.join(root, "apps/ledger-live-desktop/.env.production"));
      return {
        name: this.name,
        fid: "cI3hpM2p6XU0FsqcJ68xkh",
        appId: env.FIREBASE_APP_ID,
        apiKey: env.FIREBASE_API_KEY,
        headers: {},
        fetchParams: {
          appVersion: readJson(path.join(root, "apps/ledger-live-desktop/package.json")).version,
          sdkVersion: "w:0.6.0",
        },
      };
    },
  },
  {
    name: "lwm-android",
    resolve(root) {
      const services = readJson(
        path.join(root, "apps/ledger-live-mobile/android/app/src/release/google-services.json"),
      );
      const packageName = "com.ledger.live";
      const client = services.client.find(
        c => c.client_info.android_client_info.package_name === packageName,
      );
      return {
        name: this.name,
        fid: "eqUCyHdfI11nqbgUHhXZYp",
        appId: client.client_info.mobilesdk_app_id,
        apiKey: client.api_key[0].current_key,
        headers: { "X-Android-Package": packageName },
        fetchParams: {
          appVersion: mobileVersion(root),
          packageName,
          platformVersion: "34",
          sdkVersion: "22.0.0",
        },
      };
    },
  },
  {
    name: "lwm-ios",
    resolve(root) {
      const plist = path.join(
        root,
        "apps/ledger-live-mobile/ios/GoogleService-Info-Production.plist",
      );
      const bundleId = readPlistString(plist, "BUNDLE_ID");
      return {
        name: this.name,
        fid: "eVqeUj35FhljniD6Z3pLV3",
        appId: readPlistString(plist, "GOOGLE_APP_ID"),
        apiKey: readPlistString(plist, "API_KEY"),
        headers: { "X-Ios-Bundle-Identifier": bundleId },
        fetchParams: {
          appVersion: mobileVersion(root),
          packageName: bundleId,
          platformVersion: "18.0",
          sdkVersion: "11.0.0",
        },
      };
    },
  },
];
