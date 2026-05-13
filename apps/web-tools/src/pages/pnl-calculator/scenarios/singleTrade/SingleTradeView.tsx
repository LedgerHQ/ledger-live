import { BTC } from "@ledgerhq/wallet-pnl/scenarios";
import { PnlInputsCard } from "../../shared/components/PnlInputsCard";
import { PnlOutcomeCard } from "../../shared/components/PnlOutcomeCard";
import { PnlScenarioLayout } from "../../shared/components/PnlScenarioLayout";
import { useSingleTradeViewModel } from "./useSingleTradeViewModel";

const BTC_ICON = { ledgerId: BTC.id, ticker: BTC.ticker };

export function SingleTradeView() {
  const vm = useSingleTradeViewModel();

  return (
    <PnlScenarioLayout
      inputs={
        <PnlInputsCard
          icons={[BTC_ICON]}
          title="Bitcoin"
          description="BTC · trade inputs"
          trailing={{ label: vm.qtyBtcLabel, value: vm.formattedInvestment }}
          fields={[
            {
              kind: "amount",
              id: "investment",
              label: "Investment",
              value: vm.investment,
              currencySymbol: vm.currencySymbol,
              onChange: vm.setInvestment,
            },
            {
              kind: "amount",
              id: "buyPrice",
              label: "Buy price",
              value: vm.buyPrice,
              currencySymbol: vm.currencySymbol,
              onChange: vm.setBuyPrice,
            },
            {
              kind: "amount",
              id: "sellPrice",
              label: "Sell price",
              value: vm.sellPrice,
              currencySymbol: vm.currencySymbol,
              onChange: vm.setSellPrice,
            },
            {
              kind: "amount",
              id: "investmentFee",
              label: "Investment fee",
              value: vm.investmentFee,
              currencySymbol: vm.currencySymbol,
              onChange: vm.setInvestmentFee,
            },
            {
              kind: "amount",
              id: "exitFee",
              label: "Exit fee",
              value: vm.exitFee,
              currencySymbol: vm.currencySymbol,
              onChange: vm.setExitFee,
            },
          ]}
          footer="Not investment advice. Figures update as you edit; BTC quantity is inferred from investment ÷ buy price."
        />
      }
      outcome={
        <PnlOutcomeCard
          icons={[BTC_ICON]}
          title="Outcome"
          description="After fees"
          headline={{
            value: vm.formattedNetPnL,
            tone: vm.outcomeTone,
            sub: { value: vm.formattedPctVsInvestment, tone: vm.outcomeTone },
          }}
          stats={[
            {
              id: "total-investment",
              label: "Total investment (in + fee)",
              value: vm.formattedTotalInvestment,
            },
            {
              id: "take-home",
              label: "Total take-home (net proceeds)",
              value: vm.formattedTotalTakeHome,
            },
          ]}
          footer="P/L line is gross from wallet-pnl minus entry and exit fees."
        />
      }
    />
  );
}
