import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { StepProps } from "../types";
import { AptosMappedStakingPosition } from "@ledgerhq/live-common/families/aptos/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { ValidatorField, AmountField } from "../fields";
import Text from "~/renderer/components/Text";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import { useAptosValidators } from "@ledgerhq/live-common/families/aptos/react";

export default function StepAmount({
  account,
  transaction,
  onUpdateTransaction,
  status,
  error,
}: Readonly<StepProps>) {
  const { t } = useTranslation();

  const validators = useAptosValidators(account.currency);

  const [staked, setStaked] = useState(transaction.amount);
  const bridge = getAccountBridge(account);

  const updateValidator = useCallback(
    ({ address, amount }: { address: string; amount: BigNumber }) => {
      onUpdateTransaction(tx =>
        bridge.updateTransaction(tx, {
          ...tx,
          recipient: address || tx.recipient,
          amount,
          useAllAmount: amount.eq(staked),
        }),
      );
    },
    [onUpdateTransaction, bridge, staked],
  );

  const onChangeValidator = useCallback(
    (validator?: AptosMappedStakingPosition | null) => {
      if (!validator) return;
      setStaked(validator.active);
      updateValidator({
        address: validator.validatorId,
        amount: validator.active,
      });
    },
    [updateValidator],
  );

  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      updateValidator({
        amount,
        address: "",
      });
    },
    [updateValidator],
  );

  const validator = useMemo(() => {
    return {
      validatorAddress: transaction.recipient,
      amount: transaction.amount,
    };
  }, [transaction]);

  const amount = useMemo(() => (validator ? validator.amount : new BigNumber(0)), [validator]);

  const validatorData = validators.find(v => v.address === validator.validatorAddress);
  const nextUnlockTime = validatorData?.nextUnlockTime ?? undefined;

  return (
    <Box flow={1}>
      <TrackPage
        category="Restaking Flow"
        name="Step 1"
        flow="stake"
        action="restaking"
        currency="aptos"
      />
      {error && <ErrorBanner error={error} />}
      <Box horizontal justifyContent="center" mb={2}>
        <Text ff="Inter|Medium" fontSize={4}>
          {nextUnlockTime ? (
            <Trans
              i18nKey={t("aptos.restake.flow.steps.amount.subtitle", {
                timeToUnlock: nextUnlockTime,
              })}
            />
          ) : (
            <Trans i18nKey="aptos.restake.flow.steps.amount.subtitle2" />
          )}
        </Text>
      </Box>
      <ValidatorField account={account} transaction={transaction} onChange={onChangeValidator} />
      <AmountField
        amount={amount}
        validator={validator}
        account={account}
        status={status}
        onChange={onChangeAmount}
        label={<Trans i18nKey="aptos.restake.flow.steps.amount.fields.amount" />}
      />
      <Box mb={1} />
    </Box>
  );
}

export function StepAmountFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
}: Readonly<StepProps>) {
  const { t } = useTranslation();
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("device")}>
          {t("common.continue")}
        </Button>
      </Box>
    </>
  );
}
