import { PnlScenarioLayout } from "../../shared/components/PnlScenarioLayout";
import { MultiAccountsList } from "./components/MultiAccountsList";
import { MultiOutcomeCard } from "./components/MultiOutcomeCard";
import { SingleAssetInputs } from "./components/SingleAssetInputs";
import { SingleOutcomeCard } from "./components/SingleOutcomeCard";
import { TraderInputsCard } from "./components/TraderInputsCard";
import { TraderModeTabs } from "./components/TraderModeTabs";
import { uniqueIcons } from "./components/uniqueIcons";
import { useTraderViewModel } from "./useTraderViewModel";

export function TraderView() {
  const vm = useTraderViewModel();
  const isSingle = vm.mode === "single";

  const inputsHeader = isSingle
    ? {
        icons: [{ ledgerId: vm.single.asset.currency.id, ticker: vm.single.ticker }],
        title: "Trading account",
        description: `${vm.single.ticker}/${vm.fiatTicker} · manual operations`,
        opsCount: vm.single.opsCount,
        footer: `${vm.single.inCount} IN · ${vm.single.outCount} OUT · ${vm.single.feesCount} FEES. Current price drives the latest counter-value used for unrealised PnL.`,
      }
    : {
        icons: uniqueIcons(vm.multi),
        title: "Trading accounts",
        description: `${vm.multi.accounts.length} account${vm.multi.accounts.length === 1 ? "" : "s"} · in ${vm.fiatTicker}`,
        opsCount: vm.multi.opsCount,
        footer: `${vm.multi.accounts.length} account${vm.multi.accounts.length === 1 ? "" : "s"} · ${vm.multi.opsCount} ops applied. Each account contributes to the portfolio PnL via computePortfolioPnL.`,
      };

  return (
    <PnlScenarioLayout
      inputs={
        <TraderInputsCard {...inputsHeader}>
          <TraderModeTabs selectedMode={vm.mode} onSelectedModeChange={vm.setMode} />
          {isSingle ? (
            <SingleAssetInputs single={vm.single} fiatTicker={vm.fiatTicker} />
          ) : (
            <MultiAccountsList multi={vm.multi} fiatTicker={vm.fiatTicker} />
          )}
        </TraderInputsCard>
      }
      outcome={
        isSingle ? (
          <SingleOutcomeCard single={vm.single} fiatTicker={vm.fiatTicker} />
        ) : (
          <MultiOutcomeCard multi={vm.multi} fiatTicker={vm.fiatTicker} />
        )
      }
    />
  );
}
