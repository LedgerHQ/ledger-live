import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";
import { AddressSection } from "./AddressSection";
import { ChainSection } from "./ChainSection";
import { NetworkListSection } from "./NetworkListSection";

/** What the service knows about a chain, whatever the portfolio. */
export function NetworksTab(vm: Readonly<AccountPortfolioViewModel>) {
  return (
    <>
      <NetworkListSection {...vm} />
      <ChainSection {...vm} />
      <AddressSection {...vm} />
    </>
  );
}
