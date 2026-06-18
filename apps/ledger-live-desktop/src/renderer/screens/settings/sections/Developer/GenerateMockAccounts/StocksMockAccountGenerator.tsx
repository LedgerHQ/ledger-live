import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useStockAssetIds } from "@ledgerhq/live-common/dada-client/hooks/useStockAssetIds";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Flex } from "@ledgerhq/react-ui/index";
import {
  countStockTokenAccounts,
  generateStockAccounts,
  injectMockAccounts,
  removeStockAccounts,
} from "./utils";
import { useStockTokens } from "./useStockTokens";

type Props = {
  title: string;
  desc: string;
};

export default function StocksMockAccountGenerator({ title, desc }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { tokensByParent, loading: stocksLoading } = useStockTokens();
  const { ids: stockAssetIds, isLoading: stockIdsLoading } = useStockAssetIds(
    "lld",
    __APP_VERSION__,
  );
  const accounts = useSelector(accountsSelector);

  const stocksCount = tokensByParent.reduce((sum, { tokens }) => sum + tokens.length, 0);
  const heldStockAccountsCount = useMemo(
    () => countStockTokenAccounts(accounts, stockAssetIds),
    [accounts, stockAssetIds],
  );

  const handleGenerate = useCallback(async () => {
    if (!window.confirm(t("settings.developer.mockAccounts.alerts.confirmErase"))) return;
    setLoading(true);
    try {
      const generatedAccounts = generateStockAccounts(tokensByParent);
      await injectMockAccounts(generatedAccounts, true);
    } catch (error) {
      console.error("Failed to generate stock accounts:", error);
      alert(t("settings.developer.mockAccounts.alerts.generateError"));
    } finally {
      setLoading(false);
    }
  }, [t, tokensByParent]);

  const handleReset = useCallback(async () => {
    if (!window.confirm(t("settings.developer.mockAccounts.alerts.confirmResetStocks"))) return;
    setResetting(true);
    try {
      const removedCount = await removeStockAccounts(stockAssetIds);
      if (removedCount === 0) {
        alert(t("settings.developer.mockAccounts.alerts.resetStocksNothingToRemove"));
      }
    } catch (error) {
      console.error("Failed to reset stock accounts:", error);
      alert(t("settings.developer.mockAccounts.alerts.generateError"));
    } finally {
      setResetting(false);
    }
  }, [stockAssetIds, t]);

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Flex flexDirection="column" rowGap={2} alignItems="flex-end">
        <Button
          appearance="accent"
          size="sm"
          disabled={loading || resetting || stocksLoading || stocksCount === 0}
          onClick={handleGenerate}
        >
          {stocksLoading
            ? t("settings.developer.mockAccounts.buttons.loadingStocks")
            : t("settings.developer.mockAccounts.buttons.generateStockAccounts", {
                count: stocksCount,
              })}
        </Button>
        <Button
          appearance="gray"
          size="sm"
          disabled={loading || resetting || stockIdsLoading || heldStockAccountsCount === 0}
          onClick={handleReset}
        >
          {t("settings.developer.mockAccounts.buttons.resetStockAccounts")}
        </Button>
      </Flex>
    </SettingsSectionRow>
  );
}
