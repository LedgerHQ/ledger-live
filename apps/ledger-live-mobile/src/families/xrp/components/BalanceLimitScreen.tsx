import React from "react";
import { ScrollView } from "react-native";
import type BigNumber from "bignumber.js";
import { Box, Button, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { useBalanceLimitViewModel } from "./useBalanceLimitViewModel";

type Props = Readonly<{
  token: TokenCurrency;
  limit: string;
  balance?: BigNumber;
  onConfirm: (limit: BigNumber) => void;
  trackCategory: string;
}>;

export default function BalanceLimitScreen({ trackCategory, ...input }: Props) {
  const { t } = useTranslation();
  const viewModel = useBalanceLimitViewModel(input);
  const balanceLimitLabel = t("xrp.tokenSettings.balanceLimit");

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category={trackCategory} name="BalanceLimit" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label={balanceLimitLabel}
          value={viewModel.inputText}
          onChangeText={viewModel.onChangeLimitText}
          hideClearButton
          suffix={
            viewModel.isMaximum ? undefined : (
              <Text typography="body1" lx={{ color: "muted" }}>
                {viewModel.token.ticker}
              </Text>
            )
          }
          keyboardType="decimal-pad"
          status={viewModel.errorText ? "error" : undefined}
          helperText={viewModel.errorText}
          testID="xrp-limit-input"
        />
        <Box lx={{ alignItems: "flex-start" }}>
          <Button
            appearance="gray"
            size="sm"
            disabled={viewModel.isMaximum}
            onPress={viewModel.onSetMaximum}
            testID="xrp-limit-set-maximum"
          >
            {t("xrp.tokenSettings.setToMaximum")}
          </Button>
        </Box>
      </ScrollView>
      <Box lx={{ padding: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          disabled={viewModel.isConfirmDisabled}
          onPress={viewModel.onConfirm}
          testID="xrp-limit-confirm"
        >
          {t("common.confirm")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
