import React from "react";
import { ScrollView } from "react-native";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { ErrorBanner } from "../components/ErrorBanner";
import { ReviewRow, ReviewValue } from "../components/ReviewRow";
import { type Props, useReviewViewModel } from "./useReviewViewModel";

export default function Review(props: Props) {
  const { t } = useTranslation();
  const viewModel = useReviewViewModel(props);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpManageTokenFlow" name="Review" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <ReviewRow label={t("xrp.addToken.steps.review.tokenName")}>
          <ReviewValue>{`${viewModel.token.name} (${viewModel.token.ticker})`}</ReviewValue>
        </ReviewRow>
        <ReviewRow label={t("xrp.addToken.steps.review.issuer")}>
          <ReviewValue>{viewModel.token.contractAddress}</ReviewValue>
        </ReviewRow>
        <ReviewRow label={t("xrp.tokenSettings.balanceLimit")}>
          <ReviewValue>
            {viewModel.settings.isMaximum ? (
              t("xrp.tokenSettings.maximum")
            ) : (
              <CurrencyUnitValue
                unit={viewModel.token.units[0]}
                value={viewModel.settings.limit}
                showCode
              />
            )}
          </ReviewValue>
        </ReviewRow>
        <ReviewRow label={t("xrp.rippling.label")}>
          <ReviewValue>
            {t(
              viewModel.settings.isRippling ? "xrp.rippling.activated" : "xrp.rippling.deactivated",
            )}
          </ReviewValue>
        </ReviewRow>
        <ReviewRow label={t("xrp.addToken.steps.review.networkFees")}>
          <ReviewValue>
            <CurrencyUnitValue
              unit={viewModel.accountUnit}
              value={viewModel.estimatedFees}
              showCode
            />
          </ReviewValue>
        </ReviewRow>
        {viewModel.errors.map(error => (
          <ErrorBanner key={error.name} error={error} />
        ))}
        {viewModel.warnings.map(warning => (
          <ErrorBanner key={warning.name} error={warning} warning />
        ))}
      </ScrollView>
      <Box lx={{ padding: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          disabled={viewModel.isContinueDisabled}
          loading={viewModel.isContinueLoading}
          onPress={viewModel.onContinue}
          testID="xrp-manage-review-continue"
        >
          {t("common.continue")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
