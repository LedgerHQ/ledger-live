import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runEarnTest } from "./earnV2.test";

const testConfig = {
  account: Account.ETH_2,
  tmsLinks: ["B2CQA-4640"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
  ],
};

describe("Earn V2 - Cold start", () => {
  it(`Deposit ${testConfig.account.currency.name} from cold start`, async () => {
    await runEarnTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
  });
});
