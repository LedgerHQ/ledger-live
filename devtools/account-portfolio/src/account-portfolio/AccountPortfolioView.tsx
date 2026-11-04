import { ContextBar } from "../components/ContextBar/ContextBar";
import { ServiceBanner } from "../components/ServiceBanner/ServiceBanner";
import { ServiceNavBar } from "../components/ServiceNavBar/ServiceNavBar";
import { TabBar } from "../components/TabBar/TabBar";
import { HistoryTab } from "../tabs/HistoryTab/HistoryTab";
import { PortfolioTab } from "../tabs/PortfolioTab/PortfolioTab";
import { ReadTab } from "../tabs/ReadTab/ReadTab";
import { ResultsTab } from "../tabs/ResultsTab/ResultsTab";
import type { AccountPortfolioViewModel } from "./viewModelTypes";

/**
 * Presentation only: it lays the parts out and hands each the slice of the view model it needs.
 * Nothing is read from the host here.
 *
 * The service and the portfolio rarely change, so they take one line each above the tabs and the
 * content keeps the room.
 */
export function AccountPortfolioView(vm: Readonly<AccountPortfolioViewModel>) {
  return (
    <div className="flex h-full select-text flex-col gap-16 overflow-y-auto p-16">
      <ServiceNavBar {...vm} />
      <ServiceBanner {...vm} />
      <ContextBar {...vm} />
      <TabBar {...vm} historyCount={vm.history.length} />
      {vm.tab === "portfolio" ? <PortfolioTab {...vm} /> : null}
      {vm.tab === "read" ? <ReadTab {...vm} /> : null}
      {vm.tab === "results" ? <ResultsTab {...vm} /> : null}
      {vm.tab === "history" ? <HistoryTab {...vm} /> : null}
    </div>
  );
}
