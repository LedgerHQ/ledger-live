import React from "react";
import { ScrollView } from "react-native";
import { Banner, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { ErrorBanner } from "../components/ErrorBanner";
import {
  MaxLimitInfoModal,
  SwitchRow,
  TrustLimitControls,
  TrustLimitInput,
} from "../components/TrustLimitSettings";
import { type Props, useTokenSettingsViewModel } from "./useTokenSettingsViewModel";

export default function TokenSettings(props: Props) {
  const { t } = useTranslation();
  const viewModel = useTokenSettingsViewModel(props);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpManageTokenFlow" name="TokenSettings" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {viewModel.isCurrentLimitZero ? (
          <Banner
            appearance="warning"
            title={t("xrp.tokenSettings.currentLimitZero")}
            testID="xrp-current-limit-zero-warning"
          />
        ) : null}
        <TrustLimitInput
          token={viewModel.token}
          limitText={viewModel.limitText}
          isMaximum={viewModel.isMaximum}
          isInvalid={viewModel.isLimitErrorVisible}
          onChangeLimitText={viewModel.onChangeLimitText}
        />
        {viewModel.bridgeError ? <ErrorBanner error={viewModel.bridgeError} /> : null}
        {viewModel.isLimitBelowBalance ? (
          <Banner
            appearance="warning"
            title={t("xrp.tokenSettings.limitBelowBalance", { balance: viewModel.balanceText })}
            testID="xrp-limit-below-balance-warning"
          />
        ) : null}
        <Box lx={{ flex: 1 }} />
        <TrustLimitControls
          isMaximum={viewModel.isMaximum}
          isRippling={viewModel.isRippling}
          onChangeUseMax={viewModel.onChangeUseMax}
          onChangeRippling={viewModel.onChangeRippling}
          onOpenMaxLimitInfo={viewModel.onOpenMaxLimitInfo}
        >
          <SwitchRow>
            <Text typography="body2" lx={{ color: "muted" }}>
              {t("xrp.addToken.steps.review.networkFees")}
            </Text>
            <Text typography="body2SemiBold" lx={{ color: "base" }} testID="xrp-settings-fees">
              <CurrencyUnitValue
                unit={viewModel.accountUnit}
                value={viewModel.estimatedFees}
                showCode
              />
            </Text>
          </SwitchRow>
        </TrustLimitControls>
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
          disabled={viewModel.isReviewDisabled}
          loading={viewModel.isReviewLoading}
          onPress={viewModel.onReview}
          testID="xrp-settings-review"
        >
          {t("xrp.tokenSettings.review")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
