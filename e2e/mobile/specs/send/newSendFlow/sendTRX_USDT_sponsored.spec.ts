import { allure } from "jest-allure2-reporter/api";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowSponsoredTest } from "@e2e/specs/send/newSendFlowSponsored";

// No B2CQA test yet. No @LNS: its Tron app has no Tronify service page.
allure.issue("LIVE-32799");
runNewSendFlowSponsoredTest({
  transaction: new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "1"),
  tmsLinks: [],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
});
