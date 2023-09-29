import invariant from "invariant";
import React, { useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import GasPriceField from "./GasPriceField";
import MaxGasAmountField from "./MaxGasAmountField";
import SequenceNumberField from "./SequenceNumberField";
import ExpirationTimestampField from "./ExpirationTimestampField";
import { AptosFamily } from "./types";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;

type Props = NonNullable<AptosFamily["sendAmountFields"]>["component"];

const Fields = ({ account, parentAccount, transaction, updateTransaction, status }: Props) => {
  invariant(transaction.family === "aptos", "SendAmountFields: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const { t } = useTranslation();

  const [isFee, setIsFee] = useState<boolean>(true);
  const [isSettings, setIsSettings] = useState<boolean>(true);

  const gasPriceFieldElement = useRef<any>();
  const gasLimitElement = useRef<any>();
  const sequenceNumberElement = useRef<any>();
  const expirationTimestampElement = useRef<any>();

  const setOptimalGas = useCallback(() => {
    gasPriceFieldElement.current?.resetData();
    gasLimitElement.current?.resetData();

    const bridge = getAccountBridge(mainAccount);
    updateTransaction((transaction: AptosTransaction) =>
      bridge.updateTransaction(transaction, {
        options: {
          ...transaction.options,
          maxGasAmount: transaction.estimate.maxGasAmount,
          gasUnitPrice: transaction.estimate.gasUnitPrice,
        },
        skipEmulation: true,
      }),
    );
  }, [mainAccount, updateTransaction]);

  const resetSettings = useCallback(() => {
    sequenceNumberElement.current?.resetData();
    expirationTimestampElement.current?.resetData();

    const bridge = getAccountBridge(mainAccount);
    updateTransaction((transaction: AptosTransaction) =>
      bridge.updateTransaction(transaction, {
        options: {
          ...transaction.options,
          sequenceNumber: "",
          expirationTimestampSecs: "",
        },
        errors: Object.assign({}, transaction.errors, {
          sequenceNumber: "",
          expirationTimestampSecs: "",
        }),
      }),
    );
  }, [mainAccount, updateTransaction]);

  const wrapperProps = useMemo(() => {
    const props = Object.create(null);
    if (transaction.amount.isZero()) props.style = { opacity: 0.2, pointerEvents: "none" };
    return props;
  }, [transaction.amount]);

  return (
    <Box flex={1} {...wrapperProps}>
      <Box flex={1} mt={3}>
        <Box mb={1} horizontal>
          <Label onClick={() => setIsFee(!isFee)}>
            <span>{t("send.steps.details.aptosGasFee")}</span>
          </Label>
          <Button
            small
            style={{
              marginLeft: "10px",
              paddingLeft: 8,
              paddingRight: 8,
              textDecoration: "underline",
            }}
            onClick={setOptimalGas}
          >
            SET OPTIMAL GAS
          </Button>
        </Box>
        <Box mb={2} gap="2rem" horizontal grow alignItems="center" justifyContent="space-between">
          <GasPriceField
            ref={gasPriceFieldElement}
            parentAccount={parentAccount}
            account={account}
            transaction={transaction}
            status={status}
            updateTransaction={updateTransaction}
          />
          <MaxGasAmountField
            ref={gasLimitElement}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            status={status}
            updateTransaction={updateTransaction}
          />
        </Box>
      </Box>
      <Box flex={1} mt={4}>
        <Box mb={1} horizontal>
          <Label onClick={() => setIsSettings(!isSettings)}>
            <span>{t("send.steps.details.aptosAdditionalSettings")}</span>
          </Label>
          <Button
            small
            style={{
              marginLeft: "10px",
              paddingLeft: 8,
              paddingRight: 8,
              textDecoration: "underline",
            }}
            onClick={resetSettings}
          >
            RESET SETTINGS
          </Button>
        </Box>
        <Box mb={2} gap="2rem" horizontal grow alignItems="center" justifyContent="space-between">
          <SequenceNumberField
            ref={sequenceNumberElement}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            status={status}
            updateTransaction={updateTransaction}
          />
          <ExpirationTimestampField
            ref={expirationTimestampElement}
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            status={status}
            updateTransaction={updateTransaction}
          />
        </Box>
      </Box>
    </Box>
  );
};
export default {
  component: Fields,
  fields: ["gasUnitPrice", "maxGasAmount", "sequenceNumber", "expirationTimestampSecs"],
};
