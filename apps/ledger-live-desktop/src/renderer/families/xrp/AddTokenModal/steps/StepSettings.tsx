import invariant from "invariant";
import type { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { TrackScreen } from "@shared/analytics-react";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import Switch from "~/renderer/components/Switch";
import type { StepProps } from "../types";

export default function StepSettings({
  account,
  parentAccount,
  transaction,
  status,
  token,
  maxLimit,
  isRippling,
  onChangeRippling,
  onUpdateTransaction,
}: StepProps) {
  invariant(account && transaction && token, "xrp: account, transaction and token required");

  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  const onChangeLimit = useCallback(
    (limit: BigNumber) => {
      onUpdateTransaction(tx => bridge.updateTransaction(tx, { amount: limit }));
    },
    [bridge, onUpdateTransaction],
  );

  return (
    <Box flow={1}>
      <TrackScreen category="XRP add token" name="Step Settings" />
      <Alert type="primary" mb={2}>
        <Trans i18nKey="xrp.addToken.steps.settings.limitInfo" values={{ token: token.name }} />
      </Alert>
      <Label>
        <Trans i18nKey="xrp.addToken.steps.settings.limit" />
      </Label>
      <InputCurrency
        defaultUnit={token.units[0]}
        value={transaction.amount}
        onChange={onChangeLimit}
        error={status.errors.amount}
        allowZero
        renderRight={
          maxLimit?.gt(0) ? (
            <Button small mr={1} onClick={() => onChangeLimit(maxLimit)}>
              <Trans i18nKey="xrp.addToken.steps.settings.max" />
            </Button>
          ) : null
        }
        data-testid="xrp-trust-limit-input"
      />
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
  const hasLimitError = !!status.errors.amount;

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
