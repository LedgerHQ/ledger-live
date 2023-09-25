import BigNumber from "bignumber.js";
import { ExchangeRateResponseRaw } from "../../../types";
import { SwapExchangeRateAmountTooHigh, SwapExchangeRateAmountTooLow } from "../../../../../errors";

const MIN_AMOUNT_FROM = new BigNumber(0.0001);
const MAX_AMOUNT_FROM = new BigNumber(1000);

export const fetchRatesMock = (
  amountFrom: string,
  fromCurrencyID?: string,
): ExchangeRateResponseRaw[] => {
  const bigNumberAmountFrom = BigNumber(amountFrom);
  if (bigNumberAmountFrom.lte(MIN_AMOUNT_FROM)) {
    throw new SwapExchangeRateAmountTooLow(undefined, {
      minAmountFromFormatted: `${MIN_AMOUNT_FROM}`,
    });
  }

  if (bigNumberAmountFrom.gte(MAX_AMOUNT_FROM)) {
    throw new SwapExchangeRateAmountTooHigh(undefined, {
      maxAmountFromFormatted: `${MAX_AMOUNT_FROM}`,
    });
  }

  if (fromCurrencyID === "bitcoin") {
    return [
      {
        provider: "changelly",
        providerType: "CEX",
        rateId: "^WIpYZZFCdjPwLY7YLFnY*T5Q4@abI",
        from: "ethereum",
        to: "bitcoin",
        amountFrom: "100",
        amountTo: "0.059713921500",
        rate: "0.000577819215",
        payoutNetworkFees: "0.001932",
        expirationTime: "1694082226000",
        tradeMethod: "fixed",
        status: "success",
      },
      {
        provider: "changelly",
        providerType: "CEX",
        from: "ethereum",
        to: "bitcoin",
        amountFrom: "100",
        amountTo: "0.05949154",
        minAmountFrom: "21.61899",
        maxAmountFrom: "2417804.095968",
        payoutNetworkFees: "0.0019320000000000000000",
        tradeMethod: "float",
        status: "success",
      },
    ];
  }

  return [
    {
      provider: "oneinch",
      providerType: "DEX",
      providerURL: "/platform/1inch/#/1/unified/swap/usdt/eth?sourceTokenAmount=100",
      from: "ethereum/erc20/usd_tether__erc20_",
      to: "ethereum",
      amountFrom: "100",
      amountTo: "0.030863259880419774",
      minAmountFrom: "0.0",
      payoutNetworkFees: "0.00192528",
      tradeMethod: "float",
      status: "success",
    },
    {
      provider: "changelly",
      providerType: "CEX",
      rateId: "^WIpYZZFCdjPwLY7YLFnY*T5Q4@abI",
      from: "ethereum/erc20/usd_tether__erc20_",
      to: "ethereum",
      amountFrom: "100",
      amountTo: "0.059713921500",
      rate: "0.000577819215",
      payoutNetworkFees: "0.001932",
      expirationTime: "1694082226000",
      tradeMethod: "fixed",
      status: "success",
    },
    {
      provider: "changelly",
      providerType: "CEX",
      from: "ethereum/erc20/usd_tether__erc20_",
      to: "ethereum",
      amountFrom: "100",
      amountTo: "0.05949154",
      minAmountFrom: "21.61899",
      maxAmountFrom: "2417804.095968",
      payoutNetworkFees: "0.0019320000000000000000",
      tradeMethod: "float",
      status: "success",
    },
  ];
};
