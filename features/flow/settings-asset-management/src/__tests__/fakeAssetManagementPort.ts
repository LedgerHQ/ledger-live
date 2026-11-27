import { createFakePort } from "@features/flow-settings/testing";
import type { AssetManagementSettingsPort } from "../ports";
import type {
  AssetManagementSettingsValues,
  AssetManagementUpdate,
  HiddenTokenGroup,
} from "../types";

const DEFAULT_VALUES: AssetManagementSettingsValues = {
  hideEmptyTokenAccounts: false,
  filterTokenOperationsZeroAmount: false,
};

/** A port for tests: values change with each update, and the app-only actions are recorded. */
export function createFakeAssetManagementPort(
  initial?: Partial<AssetManagementSettingsValues>,
  hiddenTokens: readonly HiddenTokenGroup[] = [],
) {
  const { port, updates } = createFakePort<AssetManagementSettingsValues, AssetManagementUpdate>(
    DEFAULT_VALUES,
    initial,
  );
  const showToken = jest.fn();
  const onHiddenTokensClosed = jest.fn();

  const assetManagementPort: AssetManagementSettingsPort = {
    get values() {
      return port.values;
    },
    setValue: port.setValue,
    hiddenTokens,
    showToken,
    onHiddenTokensClosed,
  };

  return { port: assetManagementPort, updates, showToken, onHiddenTokensClosed };
}
