import { build, installFromFeed, openApp } from "./utils/builds.mts";
import { generatePrivateKey, getPub } from "./utils/crypto.mts";
import { serveFeed } from "./utils/serveFeed.mts";
import { signFeed } from "./utils/signFeed.mts";

const privateKey = generatePrivateKey();

const base = await build();
await build("minor");
signFeed(privateKey);

const feedUrl = await serveFeed();
const installedApp = await installFromFeed(base.version);
// The builds embed no key: without UPDATE_CHECK_PUBKEY the app checks the update with Ledger's own.
openApp(installedApp, {
  UPDATE_FEED_URL: feedUrl,
  UPDATE_CHECK_FEED: feedUrl,
  UPDATE_CHECK_PUBKEY: getPub(privateKey),
});
console.log("Press Ctrl+C to stop serving the feed");
