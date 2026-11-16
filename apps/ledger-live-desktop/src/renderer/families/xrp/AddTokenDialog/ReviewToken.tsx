import React from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { useCalculate } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { LabelWithInfo } from "../components/LabelWithInfo";
import { SignatureSteps } from "../components/Signature";
import { StepScreen } from "../components/StepScreen";
import { LimitScreen, TrustSettingsRows } from "../components/TrustSettings";
import { useReviewTokenViewModel } from "./useReviewTokenViewModel";

type Props = Readonly<{
  account: Account;
  token: TokenCurrency;
  onBack: () => void;
  onClose: () => void;
}>;

function ReviewRow({
  label,
  children,
  testID,
}: Readonly<{ label: React.ReactNode; children?: React.ReactNode; testID?: string }>) {
  return (
    <div className="flex items-center justify-between" data-testid={testID}>
      <span className="body-2 text-muted">{label}</span>
      <span className="flex items-center gap-4 body-2-semi-bold text-base">{children}</span>
    </div>
  );
}

function XrpAmount({ account, value }: Readonly<{ account: Account; value: BigNumber }>) {
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatValue = useCalculate({
    from: account.currency,
    to: counterValueCurrency,
    value: value.toNumber(),
    disableRounding: true,
  });

  const cryptoText = formatCurrencyUnit(account.currency.units[0], value, {
    locale,
    showCode: true,
    disableRounding: true,
  });
  const fiatText = formatCurrencyUnit(
    counterValueCurrency.units[0],
    new BigNumber(fiatValue ?? 0),
    {
      locale,
      showCode: true,
    },
  );

  return (
    <>
      <span className="body-2 text-muted">{`${cryptoText} ·`}</span>
      {fiatText}
    </>
  );
}

export function ReviewToken({ account, token, onBack, onClose }: Props) {
  const { t } = useTranslation();
  const viewModel = useReviewTokenViewModel(account, token);

  if (viewModel.signature.phase !== "idle") {
    return (
      <SignatureSteps
        signature={viewModel.signature}
        successTitle={t("xrp.addTokenDialog.success.title")}
        successDescription={t("xrp.addTokenDialog.success.description")}
        successCtaLabel={t("xrp.addTokenDialog.success.cta")}
        errorTitle={t("xrp.addTokenDialog.error.title")}
        onClose={onClose}
      />
    );
  }

  if (viewModel.trustSettings.isLimitStep) {
    return (
      <LimitScreen
        settings={viewModel.trustSettings}
        isPending={viewModel.bridgePending}
        onClose={onClose}
      />
    );
  }

  return (
    <StepScreen title={t("xrp.addTokenDialog.title")} onBack={onBack} onClose={onClose}>
      <div className="flex flex-col gap-8">
        <ReviewRow
          label={
            <LabelWithInfo
              label={t("xrp.manageAssets.tokenType")}
              info={t("xrp.manageAssets.tokenTypeTooltip")}
            />
          }
        >
          {viewModel.isIou ? t("xrp.manageAssets.iou") : t("xrp.manageAssets.mpt")}
        </ReviewRow>
        <ReviewRow label={t("xrp.addTokenDialog.account")}>
          {viewModel.shortAccountAddress}
          <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={16} />
        </ReviewRow>
        <ReviewRow label={t("xrp.addTokenDialog.asset")}>
          {token.ticker}
          <CryptoIcon ledgerId={token.id} ticker={token.ticker} size={16} />
        </ReviewRow>
        <ReviewRow label={t("xrp.manageAssets.issuer")}>{viewModel.shortIssuer}</ReviewRow>
      </div>
      <Divider />
      <div className="flex flex-col gap-8">
        <ReviewRow
          label={
            <LabelWithInfo
              label={t("xrp.manageAssets.transferFee")}
              info={t("xrp.addToken.steps.review.issuerFeeTooltip")}
            />
          }
        >
          {viewModel.transferFee}
        </ReviewRow>
        <ReviewRow label={t("xrp.addTokenDialog.networkFee")} testID="xrp-add-token-network-fee">
          <XrpAmount account={account} value={viewModel.networkFee} />
        </ReviewRow>
        <ReviewRow
          label={
            <LabelWithInfo
              label={t("xrp.addTokenDialog.lockedAmount")}
              info={t("xrp.addTokenDialog.lockedAmountTooltip")}
            />
          }
          testID="xrp-add-token-locked-amount"
        >
          <XrpAmount account={account} value={viewModel.lockedAmount} />
        </ReviewRow>
      </div>
      {viewModel.isIou ? (
        <>
          <Divider />
          <TrustSettingsRows settings={viewModel.trustSettings} />
        </>
      ) : null}
      <Button
        appearance="base"
        size="lg"
        isFull
        icon={LedgerLogo}
        disabled={viewModel.isContinueDisabled}
        onClick={viewModel.signature.onStart}
        data-testid="xrp-add-token-review-continue"
      >
        {t("common.continue")}
      </Button>
    </StepScreen>
  );
}
