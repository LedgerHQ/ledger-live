import { ResultSearch } from "../../components/ResultSearch/ResultSearch";
import type { AccountPortfolioViewModel } from "../../account-portfolio/viewModelTypes";
import { ResultCard } from "./ResultCard/ResultCard";

export function ResultsTab({
  selected,
  resultView,
  hiddenCount,
  unmatchedCount,
  searchable,
  search,
  setSearch,
  canLoadMore,
  loadMore,
  running,
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
    | "canLoadMore"
    | "loadMore"
    | "running"
  >
>) {
  if (!selected) {
    return (
      <div className="body-3 text-muted">
        No call yet. Run one from the Portfolio or Read tab: its result shows here.
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
        canLoadMore={canLoadMore}
        loading={running !== undefined}
        onLoadMore={loadMore}
      />
    </>
  );
}
