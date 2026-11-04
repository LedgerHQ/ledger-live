import marketHandlers from "./market";
import ledgerSyncHandlers from "./ledgerSync";
import cryptoIconsHandlers from "./crypto-icons";
import supportedCvsHandlers from "./supportedCvs";
import cantonHandlers from "./canton";
import calHandlers from "./cal";
import dadaHandlers from "../../src/mocks/dada/handler";

export default [
  ...marketHandlers,
  ...ledgerSyncHandlers,
  ...cryptoIconsHandlers,
  ...supportedCvsHandlers,
  ...cantonHandlers,
  ...calHandlers,
  ...dadaHandlers,
];
