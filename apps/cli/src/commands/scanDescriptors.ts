import { deviceOpt, currencyOpt } from "../scan";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { scanDescriptors } from "@ledgerhq/live-common/families/bitcoin/descriptor";

function requiredCurrency(c) {
  if (!c) throw new Error("could not find currency");
  return c;
}

export default {
  description: "Synchronize accounts with blockchain",
  args: [deviceOpt, currencyOpt],
  job: (
    opts: Partial<{
      device: string;
      currency: string;
    }>
  ) =>
    scanDescriptors(
      opts.device || "",
      requiredCurrency(findCryptoCurrencyByKeyword(opts.currency || "bitcoin"))
    ),
};
