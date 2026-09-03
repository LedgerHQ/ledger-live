import {
  getTransactionTransferFee,
  isTokenTransferTransaction,
} from "@ledgerhq/live-common/families/solana/transactions";
import invariant from "invariant";
import React from "react";
import BigNumber from "bignumber.js";
import { Linking, View } from "react-native";
import { Trans } from "~/context/Locale";
import { Link } from "@ledgerhq/native-ui";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import {
  SolanaAccount,
  SolanaTokenAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";
import LText from "~/components/LText";
import { useAccountUnit } from "~/hooks";
import { DataRowUnitValue } from "~/components/ValidateOnDeviceDataRow";

type SolanaFieldComponentProps = {
  account: SolanaAccount | SolanaTokenAccount;
  parentAccount: SolanaAccount | undefined | null;
  transaction: Transaction;
  status: TransactionStatus;
  field: DeviceTransactionField;
  device: Device;
};

const Warning = ({ transaction, device }: SolanaFieldComponentProps) => {
  invariant(transaction.family === "solana", "solana transaction");
  if (isTokenTransferTransaction(transaction) && device.modelId === DeviceModelId.nanoS) {
    return (
      <View>
        <Alert type="warning">
          <LText>
            <Trans i18nKey="solana.token.transferWarning">
              <Link type="main" onPress={() => Linking.openURL(urls.solana.splTokenInfo)} />
            </Trans>
          </LText>
        </Alert>
      </View>
    );
  }
  return null;
};

const TokenTransferFeeField = ({ account, transaction, field }: SolanaFieldComponentProps) => {
  invariant(transaction.family === "solana", "expect solana transaction");
  invariant(isTokenTransferTransaction(transaction), "expect token.transfer transaction");
  invariant(
    getTransactionTransferFee(transaction) !== undefined,
    "expect token.transfer transaction with transfer fee extension",
  );
  const unit = useAccountUnit(account);
  return (
    <DataRowUnitValue
      label={field.label}
      unit={unit}
      value={new BigNumber(getTransactionTransferFee(transaction)!.transferFee)}
    />
  );
};

export default {
  warning: Warning,
  fieldComponents: {
    "solana.token.transferFee": TokenTransferFeeField,
  },
};
