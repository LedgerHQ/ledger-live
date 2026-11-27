import { useCallback, useMemo, useState } from "react";
import type {
  AssetManagementProps,
  AssetManagementRowViewProps,
  AssetManagementViewProps,
  HiddenTokenGroupViewProps,
} from "./AssetManagement.types";
import type { AssetManagementLabels } from "./copy/useAssetManagementLabels";
import { useAssetManagementLabels } from "./copy/useAssetManagementLabels";
import { ASSET_MANAGEMENT_ROW_IDS, type AssetManagementRowId } from "./logic/assetManagementRows";
import { ASSET_MANAGEMENT_PLATFORM } from "./platform";
import type { AssetManagementSettingsPort } from "./ports";
import { getAssetManagementStateEvents } from "./tracking";
import { useAssetManagementSettingsPort } from "./useAssetManagementSettingsPort";

type RowContext = Readonly<{
  port: AssetManagementSettingsPort;
  labels: AssetManagementLabels;
  openHiddenTokens: () => void;
  base: Pick<AssetManagementRowViewProps, "id" | "testID">;
}>;

const ROW_BUILDERS: Readonly<
  Record<AssetManagementRowId, (context: RowContext) => AssetManagementRowViewProps>
> = {
  hideEmptyTokenAccounts: ({ port: { values, setValue }, labels, base }) => ({
    ...base,
    ...labels.hideEmptyTokenAccounts,
    trailing: {
      type: "toggle",
      value: values.hideEmptyTokenAccounts,
      onToggle: value => setValue({ key: "hideEmptyTokenAccounts", value }),
    },
  }),

  filterTokenOperationsZeroAmount: ({ port: { values, setValue }, labels, base }) => ({
    ...base,
    ...labels.filterTokenOperationsZeroAmount,
    trailing: {
      type: "toggle",
      value: values.filterTokenOperationsZeroAmount,
      onToggle: value => setValue({ key: "filterTokenOperationsZeroAmount", value }),
    },
  }),

  hiddenTokens: ({ labels, openHiddenTokens, base }) => ({
    ...base,
    title: labels.hiddenTokens.title,
    description: labels.hiddenTokens.description,
    trailing: { type: "button", label: labels.hiddenTokens.manage, onSelect: openHiddenTokens },
  }),
};

export function useAssetManagementViewModel({
  testID,
}: AssetManagementProps): AssetManagementViewProps {
  const port = useAssetManagementSettingsPort();
  const { values, hiddenTokens, showToken, onHiddenTokensClosed } = port;
  const labels = useAssetManagementLabels();
  const [isHiddenTokensOpen, setIsHiddenTokensOpen] = useState(false);

  const openHiddenTokens = useCallback(() => setIsHiddenTokensOpen(true), []);
  const closeHiddenTokens = useCallback(() => {
    setIsHiddenTokensOpen(false);
    onHiddenTokensClosed();
  }, [onHiddenTokensClosed]);

  const rows = useMemo(
    () =>
      ASSET_MANAGEMENT_ROW_IDS.map(id =>
        ROW_BUILDERS[id]({ port, labels, openHiddenTokens, base: { id, testID: `setting-${id}` } }),
      ),
    [port, labels, openHiddenTokens],
  );

  const groups = useMemo<readonly HiddenTokenGroupViewProps[]>(
    () =>
      hiddenTokens.map(({ network, tokens }) => ({
        network,
        tokens: tokens.map(token => ({
          ...token,
          showLabel: labels.hiddenTokens.showToken(token.name),
          onShow: () => showToken(token.id),
          testID: `hidden-token-${token.id}`,
        })),
      })),
    [hiddenTokens, labels, showToken],
  );

  const { hideEmptyTokenAccounts, filterTokenOperationsZeroAmount } = values;
  const stateEvents = useMemo(
    () =>
      getAssetManagementStateEvents(
        { hideEmptyTokenAccounts, filterTokenOperationsZeroAmount, isHiddenTokensOpen },
        ASSET_MANAGEMENT_PLATFORM,
      ),
    [hideEmptyTokenAccounts, filterTokenOperationsZeroAmount, isHiddenTokensOpen],
  );

  return {
    rows,
    hiddenTokens: {
      isOpen: isHiddenTokensOpen,
      title: labels.hiddenTokens.sheetTitle,
      description: labels.hiddenTokens.sheetDescription,
      emptyLabel: labels.hiddenTokens.empty,
      groups,
      onClose: closeHiddenTokens,
    },
    stateEvents,
    testID,
  };
}
