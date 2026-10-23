import { ResultSearch } from "../../components/ResultSearch";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";
import { ResultCard } from "./ResultCard";

export function ResultsTab({
  selected,
  resultView,
  hiddenCount,
  unmatchedCount,
  searchable,
  search,
  setSearch,
}: Readonly<
  Pick<
    AccountPortfolioViewModel,
    | "selected"
    | "resultView"
    | "hiddenCount"
    | "unmatchedCount"
    | "searchable"
    | "search"
    | "setSearch"
  >
>) {
  if (!selected) {
    return (
      <div className="body-3 text-muted">
        No call yet. Run one from the Portfolio, Read, Networks or Write tab: its result shows here.
      </div>
    );
  }
  return (
    <>
      {searchable ? <ResultSearch search={search} setSearch={setSearch} /> : null}
      <ResultCard
        run={selected}
        view={resultView}
        hiddenCount={hiddenCount}
        unmatchedCount={unmatchedCount}
      />
    </>
  );
}
