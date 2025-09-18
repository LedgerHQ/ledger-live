import { Account } from "./enum/Account";
import axios from "axios";

export async function getMinimumSwapAmount(AccountFrom: Account, AccountTo: Account) {
  try {
    const requestConfig = {
      method: "GET",
      url: `https://swap-stg.ledger-test.com/v5/quote`,
      params: {
        from: AccountFrom.currency.id,
        to: AccountTo.currency.id,
        amountFrom: 0.0001,
        addressFrom: AccountFrom.address,
        fiatForCounterValue: "USD",
        slippage: 1,
        networkFees: 0.001,
        networkFeesCurrency: AccountTo.currency.speculosApp.name.toLowerCase(),
        displayLanguage: "en",
        theme: "light",
        "providers-whitelist": "changelly,exodus,thorswap,uniswap,cic",
        tradeType: "INPUT",
        uniswapOrderType: "uniswapxv1",
      },
      headers: {
        accept: "application/json",
      },
    };

    const { data } = await axios(requestConfig);

    const minimumAmounts = data
      .filter((item: any) => item.parameter?.minAmount !== undefined)
      .map((item: any) => parseFloat(item.parameter.minAmount));

    const validMinimumAmounts = minimumAmounts.filter((amount: number) => !isNaN(amount));

    if (validMinimumAmounts.length === 0) {
      throw new Error("No valid minimum amounts returned from swap quote API.");
    }

    return Math.max(...validMinimumAmounts);
  } catch (error) {
    console.error(error);
  }
}
