import type { Run } from "../types";

/**
 * Where a portfolio stands, from the calls that worked on it. It exists once any call on its id
 * succeeded; it has accounts once they were registered, or once a read listed registrations.
 */
export function progressOf(
  history: readonly Run[],
  portfolioId: string,
): { readonly created: boolean; readonly registered: boolean } {
  // `history` is latest first, so the first portfolio view found is the freshest.
  const calls = history.filter(run => run.portfolioId === portfolioId && run.result.ok);
  const latestPortfolio = calls.find(run => run.result.view?.kind === "portfolio")?.result.view;
  return {
    created: calls.length > 0,
    registered:
      latestPortfolio?.kind === "portfolio"
        ? latestPortfolio.registrations > 0
        : calls.some(run => run.action === "registerAccounts"),
  };
}
