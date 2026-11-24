import { parseArgs } from "util";
import { build, clearUpdaterCache, installFromFeed, openApp } from "./builds.mts";
import { generatePrivateKey, getPub } from "./crypto.mts";
import { serveFeed } from "./serveFeed.mts";
import { signFeed } from "./signFeed.mts";

type AutoUpgradeOptions = ReturnType<typeof parseAutoUpgradeOptions>;

export function parseAutoUpgradeOptions() {
  const { values } = parseArgs({
    options: {
      "from-feed": { type: "boolean", default: false },
      "update-from-feed": { type: "boolean", default: false },
      "bad-signature": { type: "boolean", default: false },
      "download-speed": { type: "string" },
    },
  });
  return {
    fromFeed: values["from-feed"],
    updateFromFeed: values["update-from-feed"],
    badSignature: values["bad-signature"],
    downloadSpeed: parseDownloadSpeed(values["download-speed"]),
  };
}

export async function startAutoUpgrade(
  { fromFeed, updateFromFeed, badSignature, downloadSpeed }: AutoUpgradeOptions,
  onServe?: (file: string) => void,
) {
  const trustedKey = generatePrivateKey();

  const base = await build(undefined, { fromFeed, latest: false });
  const update = await build("minor", { fromFeed: fromFeed || updateFromFeed });
  // Like an attacker's feed: the update is signed, but not with the key the app trusts.
  signFeed(badSignature ? generatePrivateKey() : trustedKey);

  const feedUrl = await serveFeed(onServe, downloadSpeed);
  const installedApp = await installFromFeed(base.version);
  // A download left by an earlier run would be reused, and look staged before the app checks it.
  clearUpdaterCache();
  // The builds embed no key, so the app trusts only this one.
  const openInstalledApp = () =>
    openApp(installedApp, {
      UPDATE_FEED_URL: feedUrl,
      UPDATE_CHECK_FEED: feedUrl,
      UPDATE_CHECK_PUBKEY: getPub(trustedKey),
    });

  return { base, update, app: openInstalledApp(), openInstalledApp };
}

function parseDownloadSpeed(value: string | undefined) {
  if (value === undefined) return undefined;
  const megabytesPerSecond = Number(value);
  if (!(megabytesPerSecond > 0)) {
    throw new Error(`--download-speed takes a speed in MB/s above 0, got "${value}"`);
  }
  return megabytesPerSecond;
}
