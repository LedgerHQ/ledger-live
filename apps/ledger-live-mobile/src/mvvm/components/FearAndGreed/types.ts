import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";

export type FearAndGreedAppearance = "compact" | "expanded";

export interface FearAndGreedViewModel {
  readonly data: FearAndGreedIndex | undefined;
  readonly isError: boolean | undefined;
  readonly isDrawerOpen: boolean;
  readonly handleOpenDrawer: () => void;
  readonly handleCloseDrawer: () => void;
}

export type FearAndGreedViewProps = FearAndGreedViewModel & {
  readonly appearance?: FearAndGreedAppearance;
};
