import React from "react";
import { ScrollView } from "react-native";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import Alert from "~/components/Alert";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { ErrorBanner } from "../components/ErrorBanner";
import {
  MaxLimitInfoModal,
  TrustLimitControls,
  TrustLimitInput,
} from "../components/TrustLimitSettings";
import { type Props, useSettingsViewModel } from "./useSettingsViewModel";

export default function Settings(props: Props) {
  const { t } = useTranslation();
  const viewModel = useSettingsViewModel(props);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="Settings" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Alert type="primary" testID="xrp-limit-info-banner">
          {t("xrp.addToken.steps.settings.limitInfo", { token: viewModel.token.ticker })}
        </Alert>
        {viewModel.bridgeError ? <ErrorBanner error={viewModel.bridgeError} /> : null}
        <TrustLimitInput
          token={viewModel.token}
          limitText={viewModel.limitText}
          isMaximum={viewModel.isMaximum}
          isInvalid={viewModel.isLimitErrorVisible}
          onChangeLimitText={viewModel.onChangeLimitText}
        />
        <Box lx={{ flex: 1 }} />
        <TrustLimitControls
          isMaximum={viewModel.isMaximum}
          isRippling={viewModel.isRippling}
          onChangeUseMax={viewModel.onChangeUseMax}
          onChangeRippling={viewModel.onChangeRippling}
          onOpenMaxLimitInfo={viewModel.onOpenMaxLimitInfo}
        />
      </ScrollView>
      <MaxLimitInfoModal
        token={viewModel.token}
        maxLimit={viewModel.maxLimit}
        isOpened={viewModel.isMaxLimitInfoOpen}
        onClose={viewModel.onCloseMaxLimitInfo}
      />
      <Box lx={{ padding: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          disabled={viewModel.isContinueDisabled}
          loading={viewModel.isContinueLoading}
          onPress={viewModel.onContinue}
          testID="xrp-settings-continue"
        >
          {t("common.continue")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
