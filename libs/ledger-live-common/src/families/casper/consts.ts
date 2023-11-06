import { InvalidMinimumAmount, MayBlockAccount } from "./errors";

export const CASPER_FEES_MOTES = 0.1 * 1e9;
export const CASPER_FEES_CSPR = 0.1;
export const CASPER_MINIMUM_VALID_AMOUNT_MOTES = 2.5 * 1e9;
export const CASPER_MINIMUM_VALID_AMOUNT_CSPR = 2.5;
export const CASPER_SMALL_BYTES_COUNT = 75;
export const CASPER_NETWORK = "casper";
export const CASPER_CHECKSUM_HEX_LEN = 32;

export const CASPER_MAX_TRANSFER_ID = "18446744073709551615";

export const MayBlockAccountError = new MayBlockAccount("", {
  minAmount: `${CASPER_MINIMUM_VALID_AMOUNT_CSPR + CASPER_FEES_CSPR} CSPR`,
});

export const InvalidMinimumAmountError = new InvalidMinimumAmount("", {
  minAmount: `${CASPER_MINIMUM_VALID_AMOUNT_CSPR} CSPR`,
});
