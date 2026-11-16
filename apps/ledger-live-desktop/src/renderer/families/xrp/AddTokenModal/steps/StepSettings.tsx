import invariant from "invariant";
import type BigNumber from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { TrackScreen } from "@shared/analytics-react";
import { useSelector } from "LLD/hooks/redux";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import Switch from "~/renderer/components/Switch";
import { localeSelector } from "~/renderer/reducers/settings";
import { getXrpResources } from "../../utils";
import type { StepProps } from "../types";

// An unfunded account is told on the review step, with its Receive and Buy actions
function getLimitError(status: TransactionStatus): Error | undefined {
  const amountError = status.errors.amount;

  return amountError?.name === "XrpAccountNotActivated" ? undefined : amountError;
}

export default function StepSettings({
  account,
  parentAccount,
  transaction,
  status,
  error,
  token,
  maxLimit,
  isRippling,
  tokenAccount,
  onChangeRippling,
  onUpdateTransaction,
}: StepProps) {
  invariant(account && transaction && token, "xrp: account, transaction and token required");

  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);

  const isCurrentLimitZero = !!getXrpResources(tokenAccount)?.limit?.isZero();
  const isLimitStillZero = isCurrentLimitZero && transaction.amount.isZero();

  const balance = tokenAccount?.balance;
  const isLimitBelowBalance = transaction.amount.gt(0) && transaction.amount.lt(balance ?? 0);
  const formattedBalance =
    balance && formatCurrencyUnit(token.units[0], balance, { showCode: true, discreet, locale });

  const limitError = getLimitError(status);

  const onChangeLimit = useCallback(
    (limit: BigNumber) => {
      onUpdateTransaction(tx => bridge.updateTransaction(tx, { amount: limit }));
    },
    [bridge, onUpdateTransaction],
  );

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Settings" />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary" mb={2}>
        <Trans i18nKey="xrp.addToken.steps.settings.limitInfo" values={{ token: token.name }} />
      </Alert>
      <Label htmlFor="xrp-trust-limit-input">
        <Trans i18nKey="xrp.addToken.steps.settings.limit" />
      </Label>
      <InputCurrency
        defaultUnit={token.units[0]}
        value={transaction.amount}
        onChange={onChangeLimit}
        error={isLimitStillZero ? undefined : limitError}
        allowZero
        renderRight={
          maxLimit?.gt(0) ? (
            <Button small mr={1} onClick={() => onChangeLimit(maxLimit)}>
              <Trans i18nKey="xrp.addToken.steps.settings.max" />
            </Button>
          ) : null
        }
        id="xrp-trust-limit-input"
        data-testid="xrp-trust-limit-input"
      />
      {isLimitStillZero ? (
        <Alert type="warning" mt={2}>
          <Trans i18nKey="xrp.tokenSettings.currentLimitZero" />
        </Alert>
      ) : null}
      {isLimitBelowBalance ? (
        <Alert type="warning" mt={2}>
          <Trans
            i18nKey="xrp.tokenSettings.limitBelowBalance"
            values={{ balance: formattedBalance }}
          />
        </Alert>
      ) : null}
      <Box horizontal alignItems="center" justifyContent="space-between" mt={4}>
        <Label>
          <Trans i18nKey="xrp.rippling.label" />
        </Label>
        <Switch
          isChecked={isRippling}
          onChange={onChangeRippling}
          data-testid="xrp-rippling-switch"
        />
      </Box>
      {isRippling ? (
        <Alert type="warning" mt={2}>
          <Trans i18nKey="xrp.rippling.warning" />
        </Alert>
      ) : null}
    </Box>
  );
}

export function StepSettingsFooter({ transitionTo, status, bridgePending }: StepProps) {
  const hasLimitError = !!getLimitError(status);
  // Edit mode opens on the stored settings, so it disables Continue without an error message
  const isUnchanged = status.errors.transaction?.name === "XrpTrustSetUnchanged";

  return (
    <Button
      primary
      disabled={hasLimitError || isUnchanged || bridgePending}
      isLoading={bridgePending}
      onClick={() => transitionTo("review")}
    >
      <Trans i18nKey="common.continue" />
    </Button>
  );
}
