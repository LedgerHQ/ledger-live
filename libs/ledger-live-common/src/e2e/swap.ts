import { Account } from "./enum/Account";
import axios from "axios";

export async function getMinimumSwapAmount(AccountFrom: Account, AccountTo: Account) {
  try {
    const { data } = await axios({
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
    });

    const minimumAmounts = data.map((item: any) => {
      return parseFloat(item.parameter.minAmount);
    });

    const validMinimumAmounts = minimumAmounts.filter((amount: number) => !isNaN(amount));

    const maxMinAmount = Math.max(...validMinimumAmounts);
    return maxMinAmount;
  } catch (error) {
    console.error(error);
  }
}
