import React, { useCallback, useState } from "react";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
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
      alert("Please select at least one currency");
      return;
    }

    if (window.confirm("This will erase existing accounts. Continue?")) {
      try {
        const currencies = getSupportedCurrencies().filter(c => selectedCurrencyIds.includes(c.id));
        const accounts = generateAccountsForCurrencies(currencies, tokens);
        await injectMockAccounts(accounts, true);
      } catch (error) {
        console.error("Failed to generate mock accounts:", error);
        alert("Failed to generate mock accounts. Please try again.");
      }
    }

    setSelectedCurrencies({});
  }, [selectedCurrencies, tokens]);

  const selectedCount = Object.values(selectedCurrencies).filter(Boolean).length;

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Flex flexDirection="row" alignItems="flex-end" justifyContent="center" columnGap={3}>
        <Box flex={1}>
          <CurrencySelector
            selectedCurrencies={selectedCurrencies}
            onCurrencyToggle={handleCurrencyToggle}
            placeholder="Choose currencies..."
          />
        </Box>

        <Box flex={1}>
          <Text ff="Inter|Medium" fontSize={3} color="palette.text.shade100" mb={2}>
            Token IDs (optional)
          </Text>
          <Input
            value={tokens}
            onChange={setTokens}
            placeholder="token1, token2, token3"
            maxLength={200}
          />
        </Box>

        <Box>
          <Button primary disabled={selectedCount === 0} onClick={handlePressContinue}>
            Generate {selectedCount} Account{selectedCount !== 1 ? "s" : ""}
          </Button>
        </Box>
      </Flex>
    </SettingsSectionRow>
  );
}
