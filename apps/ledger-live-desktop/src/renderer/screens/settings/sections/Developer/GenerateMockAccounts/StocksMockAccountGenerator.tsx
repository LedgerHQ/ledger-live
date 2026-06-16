import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { generateStockAccounts, injectMockAccounts } from "./utils";
import { useStockTokens } from "./useStockTokens";

type Props = {
  title: string;
  desc: string;
};

export default function StocksMockAccountGenerator({ title, desc }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { tokensByParent, loading: stocksLoading } = useStockTokens();

  const stocksCount = tokensByParent.reduce((sum, { tokens }) => sum + tokens.length, 0);

  const handleGenerate = useCallback(async () => {
    if (!window.confirm(t("settings.developer.mockAccounts.alerts.confirmErase"))) return;
    setLoading(true);
    try {
      const accounts = generateStockAccounts(tokensByParent);
      await injectMockAccounts(accounts, true);
    } catch (error) {
      console.error("Failed to generate stock accounts:", error);
      alert(t("settings.developer.mockAccounts.alerts.generateError"));
    } finally {
      setLoading(false);
    }
  }, [t, tokensByParent]);

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Button
        appearance="accent"
        size="sm"
        disabled={loading || stocksLoading || stocksCount === 0}
        onClick={handleGenerate}
      >
        {stocksLoading
          ? t("settings.developer.mockAccounts.buttons.loadingStocks")
          : t("settings.developer.mockAccounts.buttons.generateStockAccounts", {
              count: stocksCount,
            })}
      </Button>
    </SettingsSectionRow>
  );
}
