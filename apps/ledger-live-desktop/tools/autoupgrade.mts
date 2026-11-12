import { parseAutoUpgradeOptions, startAutoUpgrade } from "./utils/startAutoUpgrade.mts";

await startAutoUpgrade(parseAutoUpgradeOptions());
console.log("Press Ctrl+C to stop serving the feed");
