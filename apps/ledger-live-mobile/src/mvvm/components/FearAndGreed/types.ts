import type { FearAndGreedIndex } from "@domain/entity-market-sentiment";

export interface FearAndGreedViewModel {
  readonly data: FearAndGreedIndex | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean | undefined;
  readonly isDrawerOpen: boolean;
  readonly handleOpenDrawer: () => void;
  readonly handleCloseDrawer: () => void;
}

export type FearAndGreedAppearance = "compact" | "expanded";

export type FearAndGreedProps = Readonly<{
  appearance?: FearAndGreedAppearance;
  width?: number;
}>;

export type FearAndGreedViewProps = FearAndGreedViewModel &
  Readonly<{
    appearance: FearAndGreedAppearance;
    width?: number;
  }>;
