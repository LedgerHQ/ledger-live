import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
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
import { formatIssuerFee } from "../../utils";
import type { StepProps } from "../types";

function Row({ label, children }: Readonly<{ label: React.ReactNode; children: React.ReactNode }>) {
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

function NotActivatedBanner(
  props: Readonly<{ error: Error; account: Account; onClose: () => void }>,
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
    <Alert type="error" mb={4} title={<TranslatedError error={props.error} field="title" noLink />}>
      <TranslatedError error={props.error} field="description" />
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
}: StepProps) {
  invariant(account && transaction && token, "xrp: account, transaction and token required");

  const locale = useSelector(localeSelector);
  const issuerFee = useGetIssuerFeeQuery(token);

  const errors = Object.values(status.errors);
  const warnings = Object.values(status.warnings);

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Review" />
      {error ? <ErrorBanner error={error} /> : null}
      {errors.map(statusError =>
        statusError.name === "XrpAccountNotActivated" ? (
          <NotActivatedBanner
            key={statusError.name}
            error={statusError}
            account={getMainAccount(account, parentAccount)}
            onClose={onClose}
          />
        ) : (
          <ErrorBanner key={statusError.name} error={statusError} />
        ),
      )}
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
      {issuerFee.isLoading ? null : (
        <Row
          label={
            <LabelWithInfo
              label={t("xrp.addToken.steps.review.issuerFee")}
              info={<Trans i18nKey="xrp.addToken.steps.review.issuerFeeTooltip" />}
            />
          }
        >
          <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100">
            {typeof issuerFee.data === "string" ? (
              formatIssuerFee(issuerFee.data, locale)
            ) : (
              <Trans i18nKey="xrp.addToken.steps.review.issuerFeeUnavailable" />
            )}
          </Text>
        </Row>
      )}
      {token.tokenType === "iou" ? (
        <>
          <Row label={<Trans i18nKey="xrp.addToken.steps.settings.limit" />}>
            <FormattedVal
              val={transaction.amount}
              unit={token.units[0]}
              showCode
              alwaysShowValue
              color="neutral.c100"
              fontSize={4}
            />
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
}: StepProps) {
  invariant(account, "xrp: account required");
  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <>
      <AccountFooter account={account} parentAccount={parentAccount} status={status} />
      <Button
        primary
        disabled={hasErrors || bridgePending}
        isLoading={bridgePending}
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
}
