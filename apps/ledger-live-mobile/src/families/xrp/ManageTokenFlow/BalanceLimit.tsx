import React from "react";
import { ScrollView } from "react-native";
import { Box, Button, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { type Props, useBalanceLimitViewModel } from "./useBalanceLimitViewModel";

export default function BalanceLimit(props: Props) {
  const { t } = useTranslation();
  const viewModel = useBalanceLimitViewModel(props);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpManageTokenFlow" name="BalanceLimit" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label={t("xrp.tokenSettings.balanceLimit")}
          value={viewModel.limitText}
          placeholder={viewModel.isMaximum ? t("xrp.tokenSettings.maximum") : undefined}
          onChangeText={viewModel.onChangeLimitText}
          onClear={viewModel.onClear}
          suffix={viewModel.token.ticker}
          keyboardType="decimal-pad"
          status={viewModel.isLimitZero ? "error" : undefined}
          helperText={viewModel.isLimitZero ? t("xrp.addToken.errors.limitZero") : undefined}
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
          {t("xrp.tokenSettings.confirm")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
