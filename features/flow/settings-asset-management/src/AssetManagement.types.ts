import type { SettingsRowProps } from "@features/flow-settings";
import type { AssetManagementRowId } from "./logic/assetManagementRows";
import type { AssetManagementStateEvent } from "./tracking";
import type { HiddenToken, HiddenTokenGroup } from "./types";

export type AssetManagementRowViewProps = Readonly<
  Omit<SettingsRowProps, "icon" | "settingId"> & { id: AssetManagementRowId }
>;

export type HiddenTokenViewProps = HiddenToken &
  Readonly<{ showLabel: string; onShow: () => void; testID: string }>;

export type HiddenTokenGroupViewProps = Readonly<{
  network: HiddenTokenGroup["network"];
  tokens: readonly HiddenTokenViewProps[];
}>;

export type HiddenTokensSheetViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  emptyLabel: string;
  groups: readonly HiddenTokenGroupViewProps[];
  onClose: () => void;
}>;

export type AssetManagementViewProps = Readonly<{
  rows: readonly AssetManagementRowViewProps[];
  hiddenTokens: HiddenTokensSheetViewProps;
  stateEvents: readonly AssetManagementStateEvent[];
  testID?: string;
}>;

export type AssetManagementProps = Readonly<{ testID?: string }>;
