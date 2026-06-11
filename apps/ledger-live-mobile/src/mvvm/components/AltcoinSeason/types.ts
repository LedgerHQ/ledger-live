import type { AltcoinSeasonIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";

export interface AltcoinSeasonViewModel {
  readonly data: AltcoinSeasonIndex | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean | undefined;
  readonly isDrawerOpen: boolean;
  readonly handleOpenDrawer: () => void;
  readonly handleCloseDrawer: () => void;
}

export type AltcoinSeasonProps = Readonly<{
  width?: number;
}>;

export type AltcoinSeasonViewProps = AltcoinSeasonViewModel & AltcoinSeasonProps;
