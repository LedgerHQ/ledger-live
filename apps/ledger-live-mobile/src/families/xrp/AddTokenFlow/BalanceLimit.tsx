import React from "react";
import { ScrollView } from "react-native";
import { Box, Button, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { type Props, useBalanceLimitViewModel } from "./useBalanceLimitViewModel";

export default function BalanceLimit(props: Props) {
  const { t } = useTranslation();
  const viewModel = useBalanceLimitViewModel(props);
  const balanceLimitLabel = t("xrp.tokenSettings.balanceLimit");

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="BalanceLimit" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Box lx={{ gap: "s8" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base" }}>
            {balanceLimitLabel}
          </Text>
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("xrp.tokenSettings.balanceLimitDescription")}
          </Text>
        </Box>
        <TextInput
          label={balanceLimitLabel}
          value={viewModel.inputText}
          onChangeText={viewModel.onChangeLimitText}
          onClear={viewModel.onClear}
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
