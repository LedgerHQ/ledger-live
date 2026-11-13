import { parseArgs } from "util";
import { build, installFromFeed, openApp } from "./builds.mts";
import { generatePrivateKey, getPub } from "./crypto.mts";
import { serveFeed } from "./serveFeed.mts";
import { signFeed } from "./signFeed.mts";

type AutoUpgradeOptions = ReturnType<typeof parseAutoUpgradeOptions>;

export function parseAutoUpgradeOptions() {
  const { values } = parseArgs({
    options: {
      "from-feed": { type: "boolean", default: false },
      "update-from-feed": { type: "boolean", default: false },
      "wrong-key": { type: "boolean", default: false },
    },
  });
  return {
    fromFeed: values["from-feed"],
    updateFromFeed: values["update-from-feed"],
    wrongKey: values["wrong-key"],
  };
}

export async function startAutoUpgrade(
  { fromFeed, updateFromFeed, wrongKey }: AutoUpgradeOptions,
  onServe?: (file: string) => void,
) {
  const privateKey = generatePrivateKey();

  const base = await build(undefined, { fromFeed, latest: false });
  const update = await build("minor", { fromFeed: fromFeed || updateFromFeed });
  signFeed(privateKey);

  const feedUrl = await serveFeed(onServe);
  const installedApp = await installFromFeed(base.version);
  // The builds embed no key: without UPDATE_CHECK_PUBKEY the app checks the update with Ledger's own.
  const app = openApp(installedApp, {
    UPDATE_FEED_URL: feedUrl,
    UPDATE_CHECK_FEED: feedUrl,
    ...(!wrongKey && { UPDATE_CHECK_PUBKEY: getPub(privateKey) }),
  });

  return { base, update, app };
}
