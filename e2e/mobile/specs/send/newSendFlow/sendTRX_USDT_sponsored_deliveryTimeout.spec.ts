import { allure } from "jest-allure2-reporter/api";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowSponsoredDeliveryTimeoutTest } from "@e2e/specs/send/newSendFlowSponsored";

// No B2CQA test exists for the sponsored send yet, so only its ticket is linked. No @LNS: the
// Nano S Tron app predates the Tronify service page.
allure.issue("LIVE-32799");
runNewSendFlowSponsoredDeliveryTimeoutTest(
  new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "1"),
  [],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
);
