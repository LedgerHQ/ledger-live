import { TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendSubAccountToken } from "./subAccount";

const transaction = new Transaction(TokenAccount.SUI_USDC_1, TokenAccount.SUI_USDC_2, "0.01");

runSendSubAccountToken(
  transaction,
  ["B2CQA-3908"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@sui", "@family-sui"],
);
