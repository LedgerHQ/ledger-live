import { InvalidMinimumAmount, MayBlockAccount } from "./errors";

export const CASPER_DUMMY_ADDRESS =
  "02030d18d5bed9f5015824D89367EF448041E912F358655184412E48557491aAdB85";

export const CASPER_FEES_MOTES = 0.1 * 1e9;
export const CASPER_FEES_CSPR = 0.1;
export const CASPER_MINIMUM_VALID_AMOUNT_MOTES = 2.5 * 1e9;
export const CASPER_MINIMUM_VALID_AMOUNT_CSPR = 2.5;
export const CASPER_NETWORK = "casper";
export const CASPER_CHECKSUM_HEX_LEN = 32;
export const CASPER_DEFAULT_TTL = 1800000;

export const CASPER_MAX_TRANSFER_ID = "18446744073709551615";

/** Largest page the indexer accepts; above it the request is a 400. */
export const CASPER_INDEXER_MAX_PAGE_SIZE = 250;

export const MayBlockAccountError = new MayBlockAccount("", {
  minAmount: `${CASPER_MINIMUM_VALID_AMOUNT_CSPR + CASPER_FEES_CSPR} CSPR`,
});

export const InvalidMinimumAmountError = new InvalidMinimumAmount("", {
  minAmount: `${CASPER_MINIMUM_VALID_AMOUNT_CSPR} CSPR`,
});

// Known Error Codes
export const NodeErrorCodeAccountNotFound = -32009;
export const NodeErrorCodeQueryFailed = -32003;
