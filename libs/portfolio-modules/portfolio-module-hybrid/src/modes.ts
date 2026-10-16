import { DEFAULT_PORTFOLIO_MODE, PORTFOLIO_MODES } from "@ledgerhq/portfolio-module-framework";
import type { Network, PortfolioMode } from "@ledgerhq/portfolio-module-framework";
import type { ModeOf } from "./types";

export type Modes = (network: Network) => Promise<PortfolioMode>;

const KNOWN_MODES: ReadonlySet<unknown> = new Set(PORTFOLIO_MODES);

/**
 * The mode `modeOf` gives `network`, `DEFAULT_PORTFOLIO_MODE` when the lookup fails or gives no
 * known mode. It never rejects: a lookup can come after a side saved a write.
 */
export async function resolveMode(modeOf: ModeOf, network: Network): Promise<PortfolioMode> {
  try {
    const mode = await modeOf(network);
    return KNOWN_MODES.has(mode) ? mode : DEFAULT_PORTFOLIO_MODE;
  } catch {
    return DEFAULT_PORTFOLIO_MODE;
  }
}

/** `modeOf` asked at most once per network; one per operation keeps a mode stable within it. */
export function memoizeModes(modeOf: ModeOf): Modes {
  const modes = new Map<Network, Promise<PortfolioMode>>();
  return network => {
    let mode = modes.get(network);
    if (mode === undefined) {
      mode = resolveMode(modeOf, network);
      modes.set(network, mode);
    }
    return mode;
  };
}
