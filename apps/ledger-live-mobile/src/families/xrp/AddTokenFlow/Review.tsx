import React from "react";
import { ScrollView } from "react-native";
import { Banner, Box, Button } from "@ledgerhq/lumen-ui-rnative";
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
      <TrackScreen category="XrpAddTokenFlow" name="Review" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <ReviewRow label={t("xrp.addToken.steps.review.tokenType")}>
          <ReviewValue>
            {t(
              viewModel.isIou
                ? "xrp.addToken.steps.review.tokenTypeIou"
                : "xrp.addToken.steps.review.tokenTypeMpt",
            )}
          </ReviewValue>
        </ReviewRow>
        <ReviewRow label={t("xrp.addToken.steps.review.account")}>
          <ReviewValue>{viewModel.accountAddress}</ReviewValue>
        </ReviewRow>
        <ReviewRow label={t("xrp.addToken.steps.review.tokenName")}>
          <ReviewValue>{`${viewModel.token.name} (${viewModel.token.ticker})`}</ReviewValue>
        </ReviewRow>
        <ReviewRow label={t("xrp.addToken.steps.review.issuer")}>
          <ReviewValue>{viewModel.token.contractAddress}</ReviewValue>
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

        {viewModel.settings ? (
          <>
            <ReviewRow label={t("xrp.tokenSettings.limit")}>
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
                {t(viewModel.settings.isRippling ? "xrp.rippling.on" : "xrp.rippling.off")}
              </ReviewValue>
            </ReviewRow>
          </>
        ) : null}

        {viewModel.notEnoughXrp ? (
          <Banner
            appearance="error"
            title={t("xrp.addToken.errors.notEnoughXrp", {
              minimumAmount: viewModel.notEnoughXrp.minimumAmount,
            })}
            description={
              viewModel.notEnoughXrp.lockedAmount
                ? t("xrp.addToken.errors.notEnoughXrpLocked", {
                    amount: viewModel.notEnoughXrp.lockedAmount,
                  })
                : undefined
            }
            primaryAction={
              <Button
                appearance="gray"
                size="sm"
                onPress={viewModel.onReceive}
                testID="xrp-receive"
              >
                {t("xrp.addToken.receive")}
              </Button>
            }
            secondaryAction={
              viewModel.canBuy ? (
                <Button appearance="gray" size="sm" onPress={viewModel.onBuy} testID="xrp-buy">
                  {t("account.buy")}
                </Button>
              ) : undefined
            }
            testID="xrp-not-enough-xrp"
          />
        ) : null}
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
          testID="xrp-review-continue"
        >
          {t("common.continue")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
