import marketHandlers from "./market";
import coingeckoHandlers from "./coingecko";
import ledgerSyncHandlers from "./ledgerSync";
import cryptoIconsHandlers from "./crypto-icons";
import supportedCvsHandlers from "./supportedCvs";
import dadaHandlers from "../../src/mocks/dada/handler";

export default [
  ...marketHandlers,
  ...coingeckoHandlers,
  ...ledgerSyncHandlers,
  ...cryptoIconsHandlers,
  ...supportedCvsHandlers,
  ...dadaHandlers,
];
