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
  InteractiveIcon,
  Pressable,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type BigNumber from "bignumber.js";
import { shortAddressPreview } from "@ledgerhq/live-common/account/helpers";
import { TrackScreen } from "@shared/analytics-react";
import CounterValue from "~/components/CounterValue";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { RipplingSheet } from "../ManageTokenFlow/RipplingSheet";
import { CopyButton } from "./CopyButton";
import { InfoSheet } from "./InfoSheet";
import { type InfoRow, type Props, useReviewViewModel } from "./useReviewViewModel";

type RowProps = Readonly<{
  label: string;
  children: React.ReactNode;
  info?: Readonly<{ row: InfoRow; onPress: (row: InfoRow) => void }>;
  accessory?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}>;

function Row({ label, children, info, accessory, onPress, testID }: RowProps) {
  const item = (
    <DescriptionItem size="sm">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
        {info ? (
          <InteractiveIcon
            icon={Information}
            size={16}
            iconType="stroked"
            accessibilityLabel={label}
            onPress={() => info.onPress(info.row)}
            testID={`${testID}-info`}
          />
        ) : null}
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
      <Text typography="body3" lx={{ color: "muted" }}>
        <CurrencyUnitValue unit={props.currency.units[0]} value={props.value} showCode />
      </Text>
      <CounterValue currency={props.currency} value={props.value} Wrapper={WithSeparator} />
    </>
  );
}

function ErrorBanner({ error, warning }: Readonly<{ error: Error; warning?: boolean }>) {
  const { t, i18n } = useTranslation();
  const values = { ...error, message: error.message };
  const titleKey = `errors.${error.name}.title`;
  const descriptionKey = `errors.${error.name}.description`;

  return (
    <Banner
      appearance={warning ? "warning" : "error"}
      title={t(i18n.exists(titleKey) ? titleKey : "errors.generic.title", values)}
      description={i18n.exists(descriptionKey) ? t(descriptionKey, values) : undefined}
    />
  );
}

export default function Review(props: Props) {
  const { t } = useTranslation();
  const viewModel = useReviewViewModel(props);
  const { token, currency, onOpenInfo } = viewModel;
  const accountLabel = t("xrp.addToken.steps.review.account");
  const issuerLabel = t("xrp.addToken.steps.review.issuer");

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="Review" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {t("xrp.addToken.steps.review.title")}
        </Text>
        {viewModel.isNotEnoughXrp ? (
          <Banner
            appearance="error"
            title={t("xrp.addToken.errors.notEnoughBalance")}
            description={t("xrp.addToken.errors.notEnoughBalanceText", {
              amount: viewModel.notEnoughAmount,
            })}
            primaryAction={
              <Button
                appearance="gray"
                size="sm"
                onPress={viewModel.onGoToSwap}
                testID="xrp-go-to-swap"
              >
                {t("xrp.addToken.errors.goToSwap")}
              </Button>
            }
            testID="xrp-not-enough-balance"
          />
        ) : null}
        {viewModel.errors.map(error => (
          <ErrorBanner key={error.name} error={error} />
        ))}
        <Box lx={{ gap: "s12" }}>
          <Row
            label={t("xrp.addToken.steps.review.tokenType")}
            info={{ row: "tokenType", onPress: onOpenInfo }}
            testID="xrp-review-token-type"
          >
            {t(
              viewModel.isIou
                ? "xrp.addToken.steps.review.tokenTypeIou"
                : "xrp.addToken.steps.review.tokenTypeMpt",
            )}
          </Row>
          <Row
            label={accountLabel}
            accessory={
              <CopyButton
                value={viewModel.accountAddress}
                label={accountLabel}
                testID="xrp-review-copy-account"
              />
            }
          >
            {shortAddressPreview(viewModel.accountAddress)}
          </Row>
          <Row
            label={t("xrp.addToken.steps.review.asset")}
            accessory={<CurrencyIcon currency={token} size={16} />}
          >
            {token.ticker}
          </Row>
          <Row
            label={issuerLabel}
            accessory={
              <CopyButton
                value={token.contractAddress}
                label={issuerLabel}
                testID="xrp-review-copy-issuer"
              />
            }
          >
            {shortAddressPreview(token.contractAddress)}
          </Row>
        </Box>
        <Divider />
        <Box lx={{ gap: "s12" }}>
          {viewModel.transferFeeText ? (
            <Row
              label={t("xrp.manageAssets.transferFee")}
              info={{ row: "transferFee", onPress: onOpenInfo }}
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
              info={{ row: "lockedAmount", onPress: onOpenInfo }}
              testID="xrp-review-locked-amount"
            >
              <AmountWithCounterValue currency={currency} value={viewModel.lockedAmount} />
            </Row>
          ) : null}
        </Box>
        {viewModel.isIou ? (
          <>
            <Divider />
            <Box lx={{ gap: "s12" }}>
              <Row
                label={t("xrp.tokenSettings.balanceLimit")}
                onPress={viewModel.onEditLimit}
                testID="xrp-review-limit"
              >
                {viewModel.limitText}
              </Row>
              <Row
                label={t("xrp.rippling.label")}
                info={{ row: "rippling", onPress: onOpenInfo }}
                onPress={viewModel.onOpenRipplingSheet}
                testID="xrp-review-rippling"
              >
                {t(viewModel.isRippling ? "xrp.rippling.activated" : "xrp.rippling.deactivated")}
              </Row>
            </Box>
          </>
        ) : null}
        {viewModel.isRippling ? (
          <Banner
            appearance="warning"
            title={t("xrp.rippling.warning")}
            testID="xrp-rippling-warning"
          />
        ) : null}
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
      <InfoSheet row={viewModel.infoRow} onClose={viewModel.onCloseInfo} />
      <RipplingSheet
        isOpen={viewModel.isRipplingSheetOpen}
        isRippling={viewModel.isRippling}
        onSelect={viewModel.onChangeRippling}
        onClose={viewModel.onCloseRipplingSheet}
      />
    </SafeAreaView>
  );
}
