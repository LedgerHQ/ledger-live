import type { Network, Portfolio } from "@ledgerhq/portfolio-module-framework";
import type { Modes } from "./modes";
import type { SidePortfolios } from "./portfolios";
import { readSide, registrationNetwork } from "./routing";
import { onBothSides } from "./sides";
import type { Side } from "./types";

/**
 * The items of `side` that `side` serves the reads of, in order. The others are hidden: the local
 * twins of hybrid registrations, or what a side keeps of a network that moved to the other.
 */
export async function visibleOn<T>(
  side: Side,
  items: readonly T[],
  networkOf: (item: T) => Network,
  modes: Modes,
): Promise<T[]> {
  const readSides = await Promise.all(
    items.map(async item => readSide(await modes(networkOf(item)))),
  );
  return items.filter((_, index) => readSides[index] === side);
}

async function visiblePortfolio(
  side: Side,
  portfolio: Portfolio,
  modes: Modes,
): Promise<Portfolio> {
  const [registrations, accounts] = await Promise.all([
    visibleOn(side, portfolio.registrations ?? [], registrationNetwork, modes),
    visibleOn(side, portfolio.accounts ?? [], ({ network }) => network, modes),
  ]);
  return { ...portfolio, registrations, accounts };
}

/** Each side's portfolio cut to its visible registrations and accounts. */
export const visiblePortfolios = (
  portfolios: SidePortfolios,
  modes: Modes,
): Promise<SidePortfolios> =>
  onBothSides<Portfolio | undefined>(side => {
    const portfolio = portfolios[side];
    return portfolio === undefined ? undefined : visiblePortfolio(side, portfolio, modes);
  });
