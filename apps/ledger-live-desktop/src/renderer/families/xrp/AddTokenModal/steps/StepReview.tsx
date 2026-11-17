import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { setTrackingSource } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import TranslatedError from "~/renderer/components/TranslatedError";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { localeSelector } from "~/renderer/reducers/settings";
import { formatIssuerFee, formatLongTrustLimit } from "../../utils";
import type { StepProps, TokenAction } from "../types";

export function Row({
  label,
  children,
}: Readonly<{ label: React.ReactNode; children: React.ReactNode }>) {
  return (
    <Box horizontal justifyContent="space-between" alignItems="center" mb={3}>
      <Text ff="Inter|Medium" fontSize={4} color="neutral.c70">
        {label}
      </Text>
      <Box ml={4} style={{ minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

function LabelWithInfo(props: Readonly<{ label: string; info: React.ReactNode }>) {
  return (
    <span className="flex items-center gap-4">
      {props.label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={props.label}
            className="inline-flex cursor-help border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Information size={12} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{props.info}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function GetXrpBanner(
  props: Readonly<{
    title: React.ReactNode;
    children?: React.ReactNode;
    account: Account;
    onClose: () => void;
  }>,
) {
  const { account } = props;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCurrencyAvailable } = useRampCatalog();

  const onReceive = () => {
    props.onClose();
    dispatch(openModal("MODAL_RECEIVE", { account }));
  };

  const onBuy = () => {
    props.onClose();
    setTrackingSource("XRP add token");
    navigate("/exchange", {
      state: {
        currency: account.currency.id,
        account: account.id,
        mode: "buy",
        returnTo: location.pathname,
      },
    });
  };

  return (
    <Alert type="error" mb={4} title={props.title}>
      {props.children}
      <Box horizontal mt={2} flow={4}>
        <TextButton onClick={onReceive}>
          <Trans i18nKey="xrp.addToken.steps.review.receive" />
        </TextButton>
        {isCurrencyAvailable(account.currency.id, "onRamp") ? (
          <TextButton onClick={onBuy}>
            <Trans i18nKey="buy.buyCTA" values={{ currencyTicker: account.currency.ticker }} />
          </TextButton>
        ) : null}
      </Box>
    </Alert>
  );
}

function StatusErrorBanner(
  props: Readonly<{ error: Error; action: TokenAction; account: Account; onClose: () => void }>,
) {
  const { error, account, onClose } = props;

  if (error.name === "XrpAccountNotActivated") {
    return (
      <GetXrpBanner
        title={<TranslatedError error={error} field="title" noLink />}
        account={account}
        onClose={onClose}
      >
        <TranslatedError error={error} field="description" />
      </GetXrpBanner>
    );
  }

  // Missing XRP on an edit only means the network fee, which the generic message covers
  if (error.name === "NotEnoughSpendableBalance" && props.action === "add") {
    const minimumAmount = "minimumAmount" in error ? error.minimumAmount : undefined;

    return (
      <GetXrpBanner
        title={
          <Trans i18nKey="xrp.addToken.steps.review.notEnoughReserve" values={{ minimumAmount }} />
        }
        account={account}
        onClose={onClose}
      />
    );
  }

  return <ErrorBanner error={error} />;
}

function IssuerFeeError(props: Readonly<{ onRetry: () => void }>) {
  return (
    <Alert type="error" mb={3}>
      <Trans i18nKey="xrp.addToken.steps.review.issuerFeeError" />{" "}
      <TextButton onClick={props.onRetry}>
        <Trans i18nKey="common.tryAgain" />
      </TextButton>
    </Alert>
  );
}

function TextButton(props: Readonly<{ onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="inline cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit underline"
    >
      <Text ff="Inter|SemiBold">{props.children}</Text>
    </button>
  );
}

export default function StepReview({
  t,
  account,
  parentAccount,
  onClose,
  transaction,
  status,
  token,
  error,
  isRippling,
  action,
}: StepProps) {
  invariant(account && transaction && token, "xrp: account, transaction and token required");

  const locale = useSelector(localeSelector);
  const issuerFee = useGetIssuerFeeQuery(token, { refetchOnReconnect: true });
  const unit = token.units[0];
  const limitText = isMaxTrustLimit(transaction.amount)
    ? t("xrp.addToken.steps.settings.maximum")
    : formatLongTrustLimit(transaction.amount, unit, locale);

  const errors = Object.values(status.errors);
  const warnings = Object.values(status.warnings);

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Review" />
      {error ? <ErrorBanner error={error} /> : null}
      {errors.map(statusError => (
        <StatusErrorBanner
          key={statusError.name}
          error={statusError}
          action={action}
          account={getMainAccount(account, parentAccount)}
          onClose={onClose}
        />
      ))}
      {warnings.map(warning => (
        <ErrorBanner key={warning.name} error={warning} warning />
      ))}
      <Row label={<Trans i18nKey="xrp.addToken.steps.review.token" />}>
        <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
          {`${token.name} (${token.ticker})`}
        </Text>
      </Row>
      <Row label={<Trans i18nKey="xrp.addToken.steps.review.issuer" />}>
        <Text ff="Inter|Regular" fontSize={3} color="neutral.c100" title={token.contractAddress}>
          {token.contractAddress}
        </Text>
      </Row>
      {typeof issuerFee.data === "string" ? (
        <Row
          label={
            <LabelWithInfo
              label={t("xrp.addToken.steps.review.issuerFee")}
              info={<Trans i18nKey="xrp.addToken.steps.review.issuerFeeTooltip" />}
            />
          }
        >
          <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
            {formatIssuerFee(issuerFee.data, locale)}
          </Text>
        </Row>
      ) : null}
      {issuerFee.isError ? <IssuerFeeError onRetry={issuerFee.refetch} /> : null}
      {token.tokenType === "iou" ? (
        <>
          <Row
            label={
              <LabelWithInfo
                label={t("xrp.addToken.steps.settings.limit")}
                info={<Trans i18nKey="xrp.tokenAccount.trustLimitTooltip" />}
              />
            }
          >
            {limitText ? (
              <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
                {limitText}
              </Text>
            ) : (
              <FormattedVal
                val={transaction.amount}
                unit={unit}
                showCode
                alwaysShowValue
                color="neutral.c100"
                fontSize={4}
              />
            )}
          </Row>
          <Row label={<Trans i18nKey="xrp.rippling.label" />}>
            <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
              <Trans i18nKey={isRippling ? "xrp.rippling.on" : "xrp.rippling.off"} />
            </Text>
          </Row>
        </>
      ) : null}
    </Box>
  );
}

export function StepReviewFooter({
  transitionTo,
  account,
  parentAccount,
  status,
  bridgePending,
  token,
  action,
}: StepProps) {
  invariant(account && token, "xrp: account and token required");
  // Only an add waits for the issuer fee: an edit or a removal is on a token already held
  const isAdd = action === "add";
  const issuerFee = useGetIssuerFeeQuery(token, { skip: !isAdd, refetchOnReconnect: true });
  const hasErrors = Object.keys(status.errors).length > 0;
  const isIssuerFeeMissing = isAdd && typeof issuerFee.data !== "string";

  return (
    <>
      <AccountFooter account={account} parentAccount={parentAccount} status={status} />
      <Button
        primary
        disabled={hasErrors || isIssuerFeeMissing || bridgePending}
        isLoading={bridgePending}
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
}
