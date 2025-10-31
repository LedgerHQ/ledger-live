import { runUserCanSelectCounterValueToDisplayAmountInLedgerLive } from "./settings";

const testConfig = {
  account: Account.BTC_NATIVE_SEGWIT_1,
  tmsLinks: ["B2CQA-804"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runUserCanSelectCounterValueToDisplayAmountInLedgerLive(
  testConfig.account,
  testConfig.tmsLinks,
  testConfig.tags,
);
