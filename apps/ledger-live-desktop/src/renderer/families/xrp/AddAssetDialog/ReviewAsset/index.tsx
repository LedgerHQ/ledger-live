import React from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import {
  Banner,
  Button,
  Divider,
  Link,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useGetNetworkReservesQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { formatIssuerFee } from "@ledgerhq/live-common/families/xrp/tokens";
import type { Account } from "@ledgerhq/types-live";
import { TrackScreen } from "@shared/analytics-react";
import { useSelector } from "LLD/hooks/redux";
import TranslatedError from "~/renderer/components/TranslatedError";
import { openURL } from "~/renderer/linking";
import { localeSelector } from "~/renderer/reducers/settings";
import { LabelWithInfo } from "../../components/LabelWithInfo";
import { SignatureSteps } from "../../components/Signature";
import { StepScreen } from "../../components/StepScreen";
import { BalanceLimitScreen } from "../../components/TrustSettings/BalanceLimitScreen";
import { TrustSettingsRows } from "../../components/TrustSettings/TrustSettingsRows";
import { XrpAmount } from "../../components/XrpAmount";
import { type ReviewAssetViewModel, useReviewAssetViewModel } from "./useReviewAssetViewModel";

type Props = Readonly<{
  account: Account;
  token: TokenCurrency;
  onBack: () => void;
  onClose: () => void;
}>;

type RowProps = Readonly<{
  label: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
}>;

function Row({ label, children, testID }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-16" data-testid={testID}>
      <span className="body-2 text-muted">{label}</span>
      <span className="flex items-center gap-4 body-2-semi-bold text-base">{children}</span>
    </div>
  );
}

function ValueSkeleton({ testID }: Readonly<{ testID: string }>) {
  return <Skeleton className="h-16 w-80 rounded-full" data-testid={testID} aria-hidden />;
}

function IssuerFee({ viewModel }: Readonly<{ viewModel: ReviewAssetViewModel }>) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);

  const { issuerFee } = viewModel;

  if (issuerFee.isError) {
    return t("xrp.manageAssets.transferFeeUnavailable");
  }

  if (typeof issuerFee.data === "string") {
    return t("xrp.addToken.review.issuerFeeValue", {
      fee: formatIssuerFee(issuerFee.data, locale),
    });
  }

  return <ValueSkeleton testID="xrp-add-asset-issuer-fee-loading" />;
}

function LockedAmount({ account }: Readonly<{ account: Account }>) {
  const { t } = useTranslation();
  const reserves = useGetNetworkReservesQuery(account.currency.id);

  if (reserves.isError) {
    return t("xrp.manageAssets.lockedAmountUnavailable");
  }

  if (reserves.data) {
    return (
      <XrpAmount
        currency={account.currency}
        value={new BigNumber(reserves.data.increment)}
        size="md"
      />
    );
  }

  return <ValueSkeleton testID="xrp-add-asset-locked-amount-loading" />;
}

function AssetName({ name, explorerUrl }: Readonly<{ name: string; explorerUrl?: string }>) {
  const { t } = useTranslation();

  if (!explorerUrl) return name;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={explorerUrl}
          appearance="base"
          size="inherit"
          underline={false}
          onClick={event => {
            event.preventDefault();
            openURL(explorerUrl);
          }}
          data-testid="xrp-add-asset-issuer-link"
        >
          {name}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{t("xrp.addToken.review.viewIssuer")}</TooltipContent>
    </Tooltip>
  );
}

function StatusBanner({ viewModel }: Readonly<{ viewModel: ReviewAssetViewModel }>) {
  const { t } = useTranslation();

  const getXrpButton = (
    <Button appearance="transparent" size="sm" onClick={viewModel.onSwap}>
      {t("xrp.addToken.review.notEnoughBalance.swap")}
    </Button>
  );

  if (viewModel.minimumAmount) {
    return (
      <Banner
        appearance="error"
        title={t("xrp.addToken.review.notEnoughBalance.title")}
        description={t("xrp.addToken.review.notEnoughBalance.description", {
          amount: viewModel.minimumAmount,
        })}
        primaryAction={getXrpButton}
        data-testid="xrp-add-asset-not-enough-balance"
      />
    );
  }

  if (!viewModel.error) {
    return null;
  }

  if (viewModel.isNotActivated) {
    return (
      <Banner
        appearance="error"
        title={t("errors.XrpAccountNotActivated.title")}
        description={<TranslatedError error={viewModel.error} field="description" />}
        primaryAction={getXrpButton}
        data-testid="xrp-add-asset-not-activated"
      />
    );
  }

  return (
    <Banner
      appearance="error"
      description={<TranslatedError error={viewModel.error} field="title" />}
      data-testid="xrp-add-asset-error"
    />
  );
}

export function ReviewAsset({ account, token, onBack, onClose }: Props) {
  const { t } = useTranslation();
  const viewModel = useReviewAssetViewModel(account, token, onClose);

  const { signature, trustSettings } = viewModel;

  if (signature.phase !== "idle") {
    return (
      <>
        {signature.phase === "success" ? (
          <TrackScreen category="XRP add token" name="Step Confirmed" />
        ) : null}
        {signature.phase === "error" ? (
          <TrackScreen category="XRP add token" name="Step Confirmation Error" />
        ) : null}
        <SignatureSteps
          signature={signature}
          successTitle={t("xrp.addToken.result.successTitle")}
          successDescription={t("xrp.addToken.result.successDescription")}
          hideViewDetails
          errorTitle={t("xrp.addToken.result.errorTitle")}
          onClose={onClose}
        />
      </>
    );
  }

  if (trustSettings.isLimitStep) {
    return (
      <>
        <TrackScreen category="XRP add token" name="Step Settings" />
        <BalanceLimitScreen settings={trustSettings} onClose={onClose} />
      </>
    );
  }

  return (
    <StepScreen title={t("xrp.addToken.review.title")} onBack={onBack} onClose={onClose}>
      <TrackScreen category="XRP add token" name="Step Review" />
      <StatusBanner viewModel={viewModel} />
      <div className="flex flex-col gap-12">
        <Row
          label={
            <LabelWithInfo
              label={t("xrp.manageAssets.tokenType")}
              info={t("xrp.manageAssets.tokenTypeTooltip")}
            />
          }
        >
          {viewModel.isIou ? t("xrp.manageAssets.iou") : t("xrp.manageAssets.mpt")}
        </Row>
        <Row label={t("xrp.addToken.review.account")}>
          {formatAddress(account.freshAddress)}
          <CryptoIcon ledgerId={account.currency.id} ticker={account.currency.ticker} size={20} />
        </Row>
        <Row label={t("xrp.addToken.review.asset")} testID="xrp-add-asset-asset">
          <AssetName name={token.name} explorerUrl={viewModel.explorerUrl} />
          <CryptoIcon
            ledgerId={token.id}
            ticker={token.ticker}
            network={account.currency.isTestnetFor ?? account.currency.id}
            size={20}
          />
        </Row>
      </div>
      <Divider />
      <div className="flex flex-col gap-12">
        <Row
          label={
            <LabelWithInfo
              label={t("xrp.manageAssets.issuerFee")}
              info={t("xrp.addToken.steps.review.issuerFeeTooltip")}
            />
          }
          testID="xrp-add-asset-issuer-fee"
        >
          <IssuerFee viewModel={viewModel} />
        </Row>
        <Row label={t("xrp.addToken.review.networkFee")} testID="xrp-add-asset-network-fee">
          {viewModel.bridgePending ? (
            <ValueSkeleton testID="xrp-add-asset-network-fee-loading" />
          ) : (
            <XrpAmount currency={account.currency} value={viewModel.networkFee} size="md" />
          )}
        </Row>
        <Row
          label={
            <LabelWithInfo
              label={t("xrp.manageAssets.lockedAmount")}
              info={t("xrp.addToken.review.lockedAmountTooltip")}
            />
          }
          testID="xrp-add-asset-locked-amount"
        >
          <LockedAmount account={account} />
        </Row>
      </div>
      {viewModel.isIou ? (
        <>
          <Divider />
          <TrustSettingsRows settings={trustSettings} />
        </>
      ) : null}
      <Button
        appearance="base"
        size="lg"
        isFull
        icon={LedgerLogo}
        loading={viewModel.bridgePending}
        disabled={viewModel.isContinueDisabled}
        onClick={signature.onStart}
        data-testid="xrp-add-asset-continue"
      >
        {t("common.continue")}
      </Button>
    </StepScreen>
  );
}
