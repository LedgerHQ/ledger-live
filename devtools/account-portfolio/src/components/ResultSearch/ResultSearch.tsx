import { SearchInput } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../account-portfolio/viewModelTypes";

/** Narrows the lines of a long result: tokens, networks, accounts, hashes. */
export function ResultSearch({
  search,
  setSearch,
}: Readonly<Pick<AccountPortfolioViewModel, "search" | "setSearch">>) {
  return (
    <SearchInput
      value={search}
      onChange={e => setSearch(e.target.value)}
      onClear={() => setSearch("")}
      placeholder="Search a token, a network, an account or a hash"
    />
  );
}
