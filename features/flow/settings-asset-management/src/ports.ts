import type { SettingsPort } from "@features/flow-settings";
import type {
  AssetManagementSettingsValues,
  AssetManagementUpdate,
  HiddenTokenGroup,
} from "./types";

/** What a change of an Asset management setting does in the app. One method per setting. */
export type AssetManagementSideEffects = Readonly<{
  setHideEmptyTokenAccounts(value: boolean): void;
  setFilterTokenOperationsZeroAmount(value: boolean): void;
}>;

/**
 * The port the app provides to the Asset management section: its values, its changes, and the
 * hidden tokens the app loads from its store.
 */
export type AssetManagementSettingsPort = SettingsPort<
  AssetManagementSettingsValues,
  AssetManagementUpdate
> &
  Readonly<{
    hiddenTokens: readonly HiddenTokenGroup[];
    showToken(tokenId: string): void;
    onHiddenTokensClosed(): void;
  }>;
