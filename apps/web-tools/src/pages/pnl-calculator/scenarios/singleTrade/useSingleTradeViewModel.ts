import { useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";
import {
  buildCV,
  buy,
  dailyHistory,
  makeAccount,
  resetOperationIdCounter,
  sell,
  BTC,
  SAT,
} from "@ledgerhq/wallet-pnl/scenarios";
import { computeAssetPnL, invalidatePnLCache, pnlPercentage } from "@ledgerhq/wallet-pnl";
import { formatFiat, parseBn, toMajor, ZERO, ZERO_ASSET_PNL } from "../../shared/formatting";
import { pnlToneCss } from "../../shared/toneCss";
import { useCryptoFiat } from "../../shared/useCryptoFiat";

const QUOTE_FIAT_TICKER = "USD" as const;
const BUY_DATE = new Date(Date.UTC(2025, 0, 15));
const SELL_DATE = new Date(Date.UTC(2025, 0, 16));

type SingleTradeInputs = {
  investment: BigNumber;
  buyPrice: BigNumber;
  sellPrice: BigNumber;
  investmentFee: BigNumber;
  exitFee: BigNumber;
};

type SingleTradeResult = {
  netPnL: BigNumber;
  pct: BigNumber;
  totalInvestment: BigNumber;
  totalTakeHome: BigNumber;
};

function computeSingleTradeResult(
  fiat: FiatCurrency,
  { investment, buyPrice, sellPrice, investmentFee, exitFee }: SingleTradeInputs,
): SingleTradeResult {
  if (!buyPrice.isPositive() || !investment.isPositive()) {
    return {
      netPnL: ZERO.minus(investmentFee).minus(exitFee),
      pct: ZERO,
      totalInvestment: investment.plus(investmentFee),
      totalTakeHome: investment.minus(exitFee),
    };
  }

  const qtySat = investment.div(buyPrice).times(SAT).integerValue(BigNumber.ROUND_FLOOR);

  invalidatePnLCache();
  resetOperationIdCounter();

  const buyOp = buy(qtySat, BUY_DATE);
  const sellOp = sell(qtySat, SELL_DATE);
  const account = makeAccount(BTC, { operations: [buyOp, sellOp], balance: ZERO });

  const cv = buildCV({
    pair: { from: BTC, to: fiat },
    history: dailyHistory([
      [BUY_DATE, buyPrice.toNumber()],
      [SELL_DATE, sellPrice.toNumber()],
    ]),
    latest: sellPrice.toNumber(),
  });

  const major = toMajor(computeAssetPnL(account, cv, fiat), fiat, ZERO_ASSET_PNL);
  const grossMajor = major.realisedPnL;
  // pnlPercentage is scale-invariant — major units here lets us drop the fiatMinor scaling.
  const pct = pnlPercentage(grossMajor, investment) ?? ZERO;

  return {
    netPnL: grossMajor.minus(investmentFee).minus(exitFee),
    pct,
    totalInvestment: investment.plus(investmentFee),
    totalTakeHome: investment.plus(grossMajor).minus(exitFee),
  };
}

function formatBtcQty(investment: BigNumber, buyPrice: BigNumber): string {
  if (!buyPrice.isPositive()) return "— BTC";
  const btc = investment.div(buyPrice);
  return btc.gt(0) ? `${btc.toFixed(8)} BTC` : "0 BTC";
}

export function useSingleTradeViewModel() {
  const fiat = useCryptoFiat(QUOTE_FIAT_TICKER);
  const currencySymbol = fiat.symbol ?? fiat.ticker;

  const [investment, setInvestment] = useState("10000");
  const [buyPrice, setBuyPrice] = useState("105669");
  const [sellPrice, setSellPrice] = useState("105669");
  const [investmentFee, setInvestmentFee] = useState("12");
  const [exitFee, setExitFee] = useState("15");

  const derived = useMemo(() => {
    const inputs: SingleTradeInputs = {
      investment: parseBn(investment),
      buyPrice: parseBn(buyPrice),
      sellPrice: parseBn(sellPrice),
      investmentFee: parseBn(investmentFee),
      exitFee: parseBn(exitFee),
    };
    const result = computeSingleTradeResult(fiat, inputs);
    return {
      qtyBtcLabel: formatBtcQty(inputs.investment, inputs.buyPrice),
      outcomeTone: pnlToneCss(result.netPnL),
      formattedInvestment: formatFiat(fiat, inputs.investment),
      formattedNetPnL: formatFiat(fiat, result.netPnL, true),
      formattedPctVsInvestment: `${result.pct.toFixed(2)}% vs investment`,
      formattedTotalInvestment: formatFiat(fiat, result.totalInvestment),
      formattedTotalTakeHome: formatFiat(fiat, result.totalTakeHome),
    };
  }, [fiat, investment, buyPrice, sellPrice, investmentFee, exitFee]);

  return {
    currencySymbol,
    investment,
    setInvestment,
    buyPrice,
    setBuyPrice,
    sellPrice,
    setSellPrice,
    investmentFee,
    setInvestmentFee,
    exitFee,
    setExitFee,
    ...derived,
  };
}

export type SingleTradeViewModel = ReturnType<typeof useSingleTradeViewModel>;
