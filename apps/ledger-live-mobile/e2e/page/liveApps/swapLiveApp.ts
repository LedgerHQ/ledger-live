import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapLiveAppPage {
  fromAmount = "from-account";
  toSelector = "to-account-coin-selector";

  async tapToCurrency() {
    await tapWebElementByTestId(this.toSelector);
  }

  async getMinimumAmount(swap: SwapType) {
    return (
      (await getMinimumSwapAmount(swap.accountToDebit, swap.accountToCredit))?.toString() ?? ""
    );
  }
}
