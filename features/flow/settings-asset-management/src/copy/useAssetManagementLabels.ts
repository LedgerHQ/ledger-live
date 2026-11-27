import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

type RowLabels = Readonly<{ title: string; description: string }>;

export type AssetManagementLabels = Readonly<{
  hideEmptyTokenAccounts: RowLabels;
  filterTokenOperationsZeroAmount: RowLabels;
  hiddenTokens: RowLabels &
    Readonly<{
      manage: string;
      sheetTitle: string;
      sheetDescription: string;
      empty: string;
      showToken: (tokenName: string) => string;
    }>;
}>;

export function useAssetManagementLabels(): AssetManagementLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      hideEmptyTokenAccounts: {
        title: t("settings.assetManagement.hideEmptyTokenAccounts.title"),
        description: t("settings.assetManagement.hideEmptyTokenAccounts.description"),
      },
      filterTokenOperationsZeroAmount: {
        title: t("settings.assetManagement.filterTokenOperationsZeroAmount.title"),
        description: t("settings.assetManagement.filterTokenOperationsZeroAmount.description"),
      },
      hiddenTokens: {
        title: t("settings.assetManagement.hiddenTokens.title"),
        description: t("settings.assetManagement.hiddenTokens.description"),
        manage: t("settings.assetManagement.hiddenTokens.manage"),
        sheetTitle: t("settings.assetManagement.hiddenTokens.sheetTitle"),
        sheetDescription: t("settings.assetManagement.hiddenTokens.sheetDescription"),
        empty: t("settings.assetManagement.hiddenTokens.empty"),
        showToken: (tokenName: string) =>
          t("settings.assetManagement.hiddenTokens.showToken", { token: tokenName }),
      },
    }),
    [t],
  );
}
