import { Account } from "./enum/Account";
import { sanitizeError } from "./index";
import axios from "axios";

export async function getMinimumSwapAmount(AccountFrom: Account, AccountTo: Account) {
  try {
    const addressFrom = AccountFrom.address || AccountFrom.parentAccount?.address;

    if (!addressFrom) {
      throw new Error("No address available from accounts when requesting minimum swap amount.");
    }

    const requestConfig = {
      method: "GET",
      url: "https://swap-stg.ledger-test.com/v5/quote",
      params: {
        from: AccountFrom.currency.id,
        to: AccountTo.currency.id,
        amountFrom: 0.0001,
        addressFrom,
        fiatForCounterValue: "USD",
        slippage: 1,
        networkFees: 0.001,
        networkFeesCurrency: AccountTo.currency.speculosApp.name.toLowerCase(),
        displayLanguage: "en",
        theme: "light",
        "providers-whitelist": "changelly_v2,exodus,thorswap,uniswap,cic_v2,nearintents",
        tradeType: "INPUT",
        uniswapOrderType: "uniswapxv1",
      },
      headers: { accept: "application/json" },
    };

    const { data } = await axios(requestConfig);

    const minimumAmounts = data
      .filter((item: any) => item.parameter?.minAmount !== undefined)
      .map((item: any) => Number.parseFloat(item.parameter.minAmount))
      .filter((amount: number) => !Number.isNaN(amount));

    if (minimumAmounts.length === 0) {
      throw new Error("No valid minimum amounts returned from swap quote API.");
    }

    return Math.max(...minimumAmounts);
  } catch (error: any) {
    const sanitizedError = sanitizeError(error);
    console.error("Error fetching swap minimum amount:", sanitizedError);
    // throw the sanitized error, not the original circular Axios error
    throw sanitizedError;
  }
}
