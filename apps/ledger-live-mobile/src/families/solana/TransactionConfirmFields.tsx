import invariant from "invariant";
import React from "react";
import BigNumber from "bignumber.js";
import { Linking, View } from "react-native";
import { Trans } from "react-i18next";
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
  if (
    transaction.model.commandDescriptor?.command.kind === "token.transfer" &&
    device.modelId === DeviceModelId.nanoS
  ) {
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

const TokenTranferFeeField = ({ account, transaction, field }: SolanaFieldComponentProps) => {
  invariant(transaction.family === "solana", "expect solana transaction");
  invariant(
    transaction.model.commandDescriptor?.command.kind === "token.transfer",
    "expect token.transfer transaction",
  );
  invariant(
    transaction.model.commandDescriptor.command.extensions?.transferFee !== undefined,
    "expect token.transfer transaction with transfer fee extension",
  );
  const unit = useAccountUnit(account);
  return (
    <DataRowUnitValue
      label={field.label}
      unit={unit}
      value={
        new BigNumber(
          transaction.model.commandDescriptor.command.extensions.transferFee.transferFee,
        )
      }
    />
  );
};

export default {
  warning: Warning,
  fieldComponents: {
    "solana.token.transferFee": TokenTranferFeeField,
  },
};
