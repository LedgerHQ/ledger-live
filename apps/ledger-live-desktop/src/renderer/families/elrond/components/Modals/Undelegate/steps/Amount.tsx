import React, { useCallback, useEffect, useState, Fragment } from "react";
import { useTranslation, Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { BigNumber } from "bignumber.js";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import { ValidatorField, AmountField } from "../fields";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { DelegationType } from "~/renderer/families/elrond/types";
import { StepProps } from "../types";
const StepAmount = (props: StepProps) => {
  const { account, onUpdateTransaction, status, error, contract, amount, delegations } = props;
  const [initialAmount, setInitialAmount] = useState(BigNumber(amount));
  const [value, setValue] = useState(BigNumber(amount));
  const bridge = getAccountBridge(account);
  const updateValidator = useCallback(
    (payload: Transaction) => {
      onUpdateTransaction(
        (transaction: Transaction): AccountBridge<Transaction> =>
          bridge.updateTransaction(transaction, payload),
      );
    },
    [onUpdateTransaction, bridge],
  );
  const onChangeValidator = useCallback(
    (delegation: DelegationType) => {
      updateValidator({
        recipient: delegation.contract,
        amount: BigNumber(delegation.userActiveStake),
      });
      setInitialAmount(BigNumber(delegation.userActiveStake));
      setValue(BigNumber(delegation.userActiveStake));
    },
    [updateValidator],
  );
  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      updateValidator({
        amount,
      });
      setValue(amount);
    },
    [updateValidator],
  );
  useEffect(() => {
    onUpdateTransaction(
      (transaction: Transaction): AccountBridge<Transaction> => {
        if (transaction.amount.isEqualTo(value)) {
          return transaction;
        }
        return bridge.updateTransaction(transaction, {
          amount: value,
        });
      },
    );
  }, [bridge, onUpdateTransaction, value]);
  return (
    <Box flow={1}>
      <TrackPage category="Undelegation Flow" name="Step 1" />
      {error && <ErrorBanner error={error} />}

      <Box horizontal={true} justifyContent="center" mb={2}>
        <Text ff="Inter|Medium" fontSize={4}>
          <Trans i18nKey="elrond.undelegation.flow.steps.amount.subtitle">
            <b></b>
          </Trans>
        </Text>
      </Box>

      <ValidatorField contract={contract} onChange={onChangeValidator} delegations={delegations} />

      <StepRecipientSeparator />

      <AmountField
        amount={value}
        account={account}
        status={status}
        initialAmount={initialAmount}
        onChange={onChangeAmount}
        label={<Trans i18nKey="elrond.undelegation.flow.steps.amount.fields.amount" />}
      />

      <Alert info="primary" mt={2}>
        <Trans i18nKey="elrond.undelegation.flow.steps.amount.warning">
          <b></b>
        </Trans>
      </Alert>
    </Box>
  );
};
const StepAmountFooter = (props: StepProps) => {
  const { transitionTo, account, parentAccount, onClose, status, bridgePending } = props;
  const { t } = useTranslation();
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <Fragment>
      <AccountFooter account={account} parentAccount={parentAccount} status={status} />

      <Box horizontal>
        <Button mr={1} secondary={true} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button disabled={!canNext} primary={true} onClick={() => transitionTo("device")}>
          {t("common.continue")}
        </Button>
      </Box>
    </Fragment>
  );
};
export { StepAmountFooter };
export default StepAmount;
