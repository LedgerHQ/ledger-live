import invariant from "invariant";
import BigNumber from "bignumber.js";
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  MAX_TRUST_LIMIT_VALUE,
  isMaxTrustLimitValue,
} from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { TrackScreen } from "@shared/analytics-react";
import { useSelector } from "LLD/hooks/redux";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Input from "~/renderer/components/Input";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";
import { localeSelector } from "~/renderer/reducers/settings";
import { getXrpResources } from "../../utils";
import type { StepProps } from "../types";

// An unfunded account is told on the review step, with its Receive and Buy actions
function getLimitError(status: TransactionStatus): Error | undefined {
  const amountError = status.errors.amount;

  return amountError?.name === "XrpAccountNotActivated" ? undefined : amountError;
}

export default function StepSettings({
  t,
  account,
  parentAccount,
  transaction,
  status,
  error,
  token,
  isRippling,
  tokenAccount,
  onChangeRippling,
  onUpdateTransaction,
}: StepProps) {
  invariant(account && transaction && token, "xrp: account, transaction and token required");

  const bridge = useAccountBridge<Transaction>(account, parentAccount);
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const [isLimitTyped, setIsLimitTyped] = useState(false);
  const unit = token.units[0];

  const isCurrentLimitZero = !!getXrpResources(tokenAccount)?.limit?.isZero();
  const isLimitStillZero = isCurrentLimitZero && transaction.amount.isZero();

  const balance = tokenAccount?.balance;
  const isLimitBelowBalance = transaction.amount.gt(0) && transaction.amount.lt(balance ?? 0);
  const formattedBalance =
    balance && formatCurrencyUnit(unit, balance, { discreet, locale, showCode: true });

  const isMaxLimit = isMaxTrustLimitValue(transaction.amount);
  const limitError = getLimitError(status);
  // A custom limit starts at 0: its error shows once the user types
  const isUntypedZeroLimit = limitError?.name === "XrpTrustLimitZero" && !isLimitTyped;
  const isLimitErrorHidden = isLimitStillZero || isUntypedZeroLimit;

  const onChangeLimit = useCallback(
    (limit: BigNumber) => {
      onUpdateTransaction(tx => bridge.updateTransaction(tx, { amount: limit }));
    },
    [bridge, onUpdateTransaction],
  );

  const onTypeLimit = useCallback(
    (limit: BigNumber) => {
      setIsLimitTyped(true);
      onChangeLimit(limit);
    },
    [onChangeLimit],
  );

  const onChangeMax = useCallback(
    (isChecked: boolean) => {
      setIsLimitTyped(false);
      onChangeLimit(isChecked ? MAX_TRUST_LIMIT_VALUE : new BigNumber(0));
    },
    [onChangeLimit],
  );

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Settings" />
      {error ? <ErrorBanner error={error} /> : null}
      <Alert type="primary" mb={2}>
        <Trans i18nKey="xrp.addToken.steps.settings.limitInfo" values={{ token: token.name }} />
      </Alert>
      <Box horizontal alignItems="center" justifyContent="space-between">
        <Label htmlFor="xrp-trust-limit-input">
          <Trans i18nKey="xrp.addToken.steps.settings.limit" />
        </Label>
        <Box horizontal alignItems="center">
          <Text
            color="neutral.c60"
            ff="Inter|Medium"
            fontSize={10}
            style={{ paddingRight: 5 }}
            onClick={() => onChangeMax(!isMaxLimit)}
          >
            <Trans i18nKey="xrp.addToken.steps.settings.max" />
          </Text>
          <Switch
            small
            isChecked={isMaxLimit}
            onChange={onChangeMax}
            data-testid="xrp-trust-limit-max-switch"
          />
        </Box>
      </Box>
      {isMaxLimit ? (
        <Input
          disabled
          ff="Inter"
          value={t("xrp.addToken.steps.settings.maximum")}
          error={limitError}
          id="xrp-trust-limit-input"
          data-testid="xrp-trust-limit-max"
        />
      ) : (
        <InputCurrency
          defaultUnit={unit}
          value={transaction.amount}
          onChange={onTypeLimit}
          error={isLimitErrorHidden ? undefined : limitError}
          allowZero
          id="xrp-trust-limit-input"
          data-testid="xrp-trust-limit-input"
        />
      )}
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

  return (
    <Button
      primary
      disabled={hasLimitError || bridgePending}
      isLoading={bridgePending}
      onClick={() => transitionTo("review")}
    >
      <Trans i18nKey="common.continue" />
    </Button>
  );
}
