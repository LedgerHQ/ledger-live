import React from "react";
import { ScrollView } from "react-native";
import {
  Banner,
  Box,
  Button,
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  Divider,
  Pressable,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type BigNumber from "bignumber.js";
import { shortAddressPreview } from "@ledgerhq/live-common/account/helpers";
import { TrackScreen } from "@shared/analytics-react";
import CounterValue from "~/components/CounterValue";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { ErrorBanner } from "../components/ErrorBanner";
import { FullTextBanner } from "../components/FullTextBanner";
import { InfoTooltip } from "../components/InfoTooltip";
import { RipplingSheet } from "../components/RipplingSheet";
import SignSheet from "./SignSheet";
import { useReviewViewModel } from "./useReviewViewModel";

type RowProps = Readonly<{
  label: string;
  children: React.ReactNode;
  info?: string;
  accessory?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}>;

function Row({ label, children, info, accessory, onPress, testID }: RowProps) {
  const item = (
    <DescriptionItem testID={onPress ? undefined : testID}>
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
        {info ? <InfoTooltip title={label} info={info} /> : null}
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{children}</DescriptionItemValue>
        {accessory}
        {onPress ? <ChevronRight size={16} color="muted" /> : null}
      </DescriptionItemTrailing>
    </DescriptionItem>
  );

  if (!onPress) return item;

  return (
    <Pressable onPress={onPress} testID={testID}>
      {item}
    </Pressable>
  );
}

function WithSeparator(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {` · `}
      {props.children}
    </>
  );
}

function AmountWithCounterValue(props: Readonly<{ currency: CryptoCurrency; value: BigNumber }>) {
  return (
    <>
      <Text typography="body2" lx={{ color: "muted" }}>
        <CurrencyUnitValue
          unit={props.currency.units[0]}
          value={props.value}
          showCode
          showAllDigits
        />
      </Text>
      <CounterValue currency={props.currency} value={props.value} Wrapper={WithSeparator} />
    </>
  );
}

export default function Review() {
  const { t } = useTranslation();
  const viewModel = useReviewViewModel();
  const { token, currency } = viewModel;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="Review" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 16 }}>
        <Text typography="heading3SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
          {t("xrp.addToken.steps.review.title")}
        </Text>
        {viewModel.isNotEnoughBalance ? (
          <Banner
            appearance="error"
            title={t("xrp.addToken.errors.notEnoughBalance")}
            description={t("xrp.addToken.errors.notEnoughBalanceText", {
              amount: viewModel.notEnoughAmount,
            })}
            primaryAction={
              <Button
                appearance="transparent"
                size="md"
                onPress={viewModel.onGoToSwap}
                testID="xrp-go-to-swap"
              >
                {t("xrp.addToken.errors.getXrp")}
              </Button>
            }
            testID="xrp-not-enough-balance"
          />
        ) : null}
        {viewModel.errors.map(error => (
          <ErrorBanner key={error.name} error={error} />
        ))}
        <Box lx={{ gap: "s16" }}>
          <Row
            label={t("xrp.addToken.steps.review.tokenType")}
            info={t("xrp.manageAssets.tokenTypeInfo")}
            testID="xrp-review-token-type"
          >
            {t(
              viewModel.isIou
                ? "xrp.addToken.steps.review.tokenTypeIou"
                : "xrp.addToken.steps.review.tokenTypeMpt",
            )}
          </Row>
          <Row
            label={t("xrp.addToken.steps.review.account")}
            accessory={<CurrencyIcon currency={currency} size={16} squared />}
          >
            {shortAddressPreview(viewModel.accountAddress)}
          </Row>
          <Row
            label={t("xrp.addToken.steps.review.asset")}
            accessory={<CurrencyIcon currency={token} size={16} hideNetwork />}
          >
            {token.ticker}
          </Row>
        </Box>
        <Divider lx={{ marginVertical: "s16" }} />
        <Box lx={{ gap: "s16" }}>
          {viewModel.transferFeeText ? (
            <Row
              label={t("xrp.manageAssets.transferFee")}
              info={t("xrp.manageAssets.transferFeeInfo")}
              testID="xrp-review-transfer-fee"
            >
              {viewModel.transferFeeText}
            </Row>
          ) : null}
          <Row label={t("xrp.addToken.steps.review.networkFee")} testID="xrp-review-network-fee">
            <AmountWithCounterValue currency={currency} value={viewModel.estimatedFees} />
          </Row>
          {viewModel.lockedAmount ? (
            <Row
              label={t("xrp.manageAssets.lockedAmount")}
              info={t("xrp.addToken.steps.review.lockedAmountInfo")}
              testID="xrp-review-locked-amount"
            >
              <AmountWithCounterValue currency={currency} value={viewModel.lockedAmount} />
            </Row>
          ) : null}
        </Box>
        {viewModel.isIou ? (
          <>
            <Divider lx={{ marginVertical: "s16" }} />
            <Box lx={{ gap: "s16" }}>
              <Row
                label={t("xrp.tokenSettings.balanceLimit")}
                info={t("xrp.tokenSettings.balanceLimitInfo")}
                onPress={viewModel.onEditLimit}
                testID="xrp-review-limit"
              >
                {viewModel.limitText}
              </Row>
              <Row
                label={t("xrp.rippling.label")}
                info={t("xrp.manageAssets.ripplingInfo")}
                onPress={viewModel.onOpenRipplingSheet}
                testID="xrp-review-rippling"
              >
                {t(viewModel.isRippling ? "xrp.rippling.activated" : "xrp.rippling.deactivated")}
              </Row>
            </Box>
          </>
        ) : null}
        {viewModel.isRippling ? (
          <FullTextBanner
            appearance="warning"
            description={t("xrp.rippling.warning")}
            testID="xrp-rippling-warning"
          />
        ) : null}
        {viewModel.warnings.map(warning => (
          <ErrorBanner key={warning.name} error={warning} appearance="warning" />
        ))}
      </ScrollView>
      <Box lx={{ padding: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          icon={LedgerLogo}
          isFull
          disabled={viewModel.isContinueDisabled}
          loading={viewModel.isContinueLoading}
          onPress={viewModel.onContinue}
          testID="xrp-review-continue"
        >
          {t("common.continue")}
        </Button>
      </Box>
      <SignSheet flow={viewModel.signAndBroadcast} accountId={viewModel.accountId} />
      <RipplingSheet
        isOpen={viewModel.isRipplingSheetOpen}
        isRippling={viewModel.isRippling}
        onSelect={viewModel.onChangeRippling}
        onClose={viewModel.onCloseRipplingSheet}
      />
    </SafeAreaView>
  );
}
