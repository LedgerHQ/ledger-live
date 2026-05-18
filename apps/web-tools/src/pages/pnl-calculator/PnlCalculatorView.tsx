import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import type { PnlCalculatorViewModel } from "./usePnlCalculatorViewModel";
import { PnlCalculatorNavBar } from "./shared/components/PnlCalculatorNavBar";
import { PnlScenarioTabs } from "./shared/components/PnlScenarioTabs";
import type { ScenarioId } from "./scenarios";
import { SingleTradeView } from "./scenarios/singleTrade/SingleTradeView";
import { TraderView } from "./scenarios/trader/TraderView";
import { PortfolioView } from "./scenarios/portfolio/PortfolioView";

export function PnlCalculatorView(vm: Readonly<PnlCalculatorViewModel>) {
  const { selectedScenario, setSelectedScenario } = vm;

  return (
    <ThemeProvider colorScheme="dark">
      <main className="bg-base flex min-h-screen flex-col items-center justify-start px-24 py-48">
        <div className="flex w-full max-w-960 flex-col gap-24">
          <PnlCalculatorNavBar />

          <PnlScenarioTabs
            selectedScenario={selectedScenario}
            onSelectedScenarioChange={setSelectedScenario}
          />

          {renderScenario(selectedScenario)}
        </div>
      </main>
    </ThemeProvider>
  );
}

function renderScenario(scenario: ScenarioId) {
  switch (scenario) {
    case "singleTrade":
      return <SingleTradeView />;
    case "trader":
      return <TraderView />;
    case "portfolio":
      return <PortfolioView />;
  }
}
