import { ExchangeRateV5ResponseRaw } from "../../../types";

export const fetchRatesMock: ExchangeRateV5ResponseRaw[] = [
  {
    provider: "changelly",
    providerType: "CEX",
    rateId: "DIUG%HD$YA*$8PElr0RPUaozX)XE)J",
    from: "ethereum/erc20/usd__coin",
    to: "ethereum",
    amountFrom: "100",
    amountTo: "0.059544238200",
    rate: "0.000576122382",
    payoutNetworkFees: "0.001932",
    expirationTime: "1693823734000",
    tradeMethod: "fixed",
    status: "success",
  },
  {
    provider: "changelly",
    providerType: "CEX",
    from: "ethereum/erc20/usd__coin",
    to: "ethereum",
    amountFrom: "100",
    amountTo: "0.05939418",
    minAmountFrom: "21.78063",
    maxAmountFrom: "2574469.453476",
    payoutNetworkFees: "0.0019320000000000000000",
    tradeMethod: "float",
    status: "success",
  },
];
