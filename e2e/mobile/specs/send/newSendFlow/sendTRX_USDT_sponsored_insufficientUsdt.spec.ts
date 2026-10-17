import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runNewSendFlowSponsoredInsufficientUsdtTest } from "@e2e/specs/send/newSendFlowSponsored";

// No B2CQA test exists for the sponsored send yet. No @LNS: the Nano S Tron app predates the
// Tronify service page.
runNewSendFlowSponsoredInsufficientUsdtTest(
  new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "1"),
  ["LIVE-32799"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
);
