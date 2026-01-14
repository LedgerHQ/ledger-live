import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import Text from "~/renderer/components/Text";
import Input from "~/renderer/components/Input";
import { generateAccountsForCurrencies, injectMockAccounts, getSupportedCurrencies } from "./utils";
import CurrencySelector from "./CurrencySelector";
import { Box, Flex } from "@ledgerhq/react-ui/index";

type Props = {
  title: string;
  desc: string;
};

export default function CustomMockAccountGenerator({ title, desc }: Props) {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<string>("");
  const [selectedCurrencies, setSelectedCurrencies] = useState<Record<string, boolean>>({});

  const handleCurrencyToggle = useCallback((currencyId: string) => {
    setSelectedCurrencies(prev => ({
      ...prev,
      [currencyId]: !prev[currencyId],
    }));
  }, []);

  const handlePressContinue = useCallback(async () => {
    const selectedCurrencyIds = Object.keys(selectedCurrencies).filter(
      id => selectedCurrencies[id],
    );

    if (selectedCurrencyIds.length === 0) {
      alert(t("settings.developer.mockAccounts.alerts.selectCurrency"));
      return;
    }

    if (window.confirm(t("settings.developer.mockAccounts.alerts.confirmErase"))) {
      try {
        const currencies = getSupportedCurrencies().filter(c => selectedCurrencyIds.includes(c.id));
        const accounts = generateAccountsForCurrencies(currencies, tokens);
        await injectMockAccounts(accounts, true);
      } catch (error) {
        console.error("Failed to generate mock accounts:", error);
        alert(t("settings.developer.mockAccounts.alerts.generateError"));
      }
    }

    setSelectedCurrencies({});
  }, [selectedCurrencies, tokens, t]);

  const selectedCount = Object.values(selectedCurrencies).filter(Boolean).length;

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Flex flexDirection="row" alignItems="flex-end" justifyContent="center" columnGap={3}>
        <Box flex={1}>
          <CurrencySelector
            selectedCurrencies={selectedCurrencies}
            onCurrencyToggle={handleCurrencyToggle}
            placeholder={t("settings.developer.mockAccounts.currencySelector.placeholder")}
          />
        </Box>

        <Box flex={1}>
          <Text ff="Inter|Medium" fontSize={3} color="neutral.c100" mb={2}>
            {t("settings.developer.mockAccounts.tokenIds.label")}
          </Text>
          <Input
            value={tokens}
            onChange={setTokens}
            placeholder={t("settings.developer.mockAccounts.tokenIds.placeholder")}
            maxLength={200}
          />
        </Box>

        <Box>
          <Button
            appearance="accent"
            size="sm"
            disabled={selectedCount === 0}
            onClick={handlePressContinue}
          >
            {t("settings.developer.mockAccounts.buttons.generateAccounts", {
              count: selectedCount,
            })}
          </Button>
        </Box>
      </Flex>
    </SettingsSectionRow>
  );
}
