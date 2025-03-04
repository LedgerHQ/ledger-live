import invariant from "invariant";
import React, { useMemo } from "react";
import { getDeviceTransactionConfig } from "@ledgerhq/live-common/transaction/index";
import Alert from "~/renderer/components/Alert";
import { Trans } from "react-i18next";
import ConfirmTitle from "~/renderer/components/TransactionConfirm/ConfirmTitle";
import Box from "~/renderer/components/Box";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { DeviceModelId } from "@ledgerhq/devices";
import { Link } from "@ledgerhq/react-ui";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import FormattedVal from "~/renderer/components/FormattedVal";
import { SolanaFamily, SolanaFieldComponentProps } from "./types";

type TransactionConfirmFields = SolanaFamily["transactionConfirmFields"];
type TitleComponent = NonNullable<NonNullable<TransactionConfirmFields>["title"]>;

const Title: TitleComponent = props => {
  const { transaction, account, parentAccount, status, device } = props;
  const transferTokenHelpUrl = useLocalizedUrl(urls.solana.splTokenInfo);

  const fields = getDeviceTransactionConfig({
    account,
    parentAccount,
    transaction,
    status,
  });

  const typeTransaction: string | undefined = useMemo(() => {
    const typeField = fields.find(field => field.label && field.label === "Type");

    if (typeField && typeField.type === "text" && typeField.value) {
      return typeField.value;
    }
  }, [fields]);

  if (
    transaction.model.commandDescriptor?.command.kind === "token.transfer" &&
    device.modelId === DeviceModelId.nanoS
  ) {
    return (
      <Box flexDirection="column" alignItems="center" gap={4} mb={4} justifyContent="center">
        <ConfirmTitle title={undefined} typeTransaction={typeTransaction} {...props} />
        <Alert type="warning">
          <Trans i18nKey="solana.token.transferWarning">
            <Link color="palette.warning.c60" onClick={() => openURL(transferTokenHelpUrl)} />
          </Trans>
        </Alert>
      </Box>
    );
  }

  return <ConfirmTitle title={undefined} typeTransaction={typeTransaction} {...props} />;
};

const TokenTransferFeeField = ({ account, transaction, field }: SolanaFieldComponentProps) => {
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
    <TransactionConfirmField label={field.label}>
      <FormattedVal
        color={"palette.text.shade80"}
        unit={unit}
        val={transaction.model.commandDescriptor.command.extensions.transferFee.transferFee}
        fontSize={3}
        inline
        showCode
        alwaysShowValue
        disableRounding
      />
    </TransactionConfirmField>
  );
};

const transactionConfirmFields: TransactionConfirmFields = {
  fieldComponents: {
    "solana.token.transferFee": TokenTransferFeeField,
  },
  title: Title,
};

export default transactionConfirmFields;
