import MagicEden from "~/images/liveApps/ME.webp";
import OpenSea from "~/images/liveApps/OS.webp";
import { Entry } from "./types";

const entryPointConfig = {
  [Entry.magiceden]: {
    title: `nftEntryPoint.entry.${Entry.magiceden}`,
    illustration: MagicEden,
    link: "https://magiceden.io",
  },
  [Entry.opensea]: {
    title: `nftEntryPoint.entry.${Entry.opensea}`,
    illustration: OpenSea,
    link: "https://opensea.io",
  },
};

export { entryPointConfig };
