import { Entry } from "./types";
import MagicEden from "./assets/magiceden.svg";
import OpenSea from "./assets/opensea.svg";

const entryPointConfig = {
  [Entry.magiceden]: {
    illustration: MagicEden,
    link: "https://magiceden.io",
  },
  [Entry.opensea]: {
    illustration: OpenSea,
    link: "https://opensea.io",
  },
};

export { entryPointConfig };
