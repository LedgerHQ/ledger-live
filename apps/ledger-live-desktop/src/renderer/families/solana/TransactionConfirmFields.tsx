import React, { useMemo } from "react";
import { getDeviceTransactionConfig } from "@ledgerhq/live-common/transaction/index";
import { SolanaFamily } from "./types";
import Alert from "~/renderer/components/Alert";
import { Trans } from "react-i18next";
import ConfirmTitle from "~/renderer/components/TransactionConfirm/ConfirmTitle";
import Box from "~/renderer/components/Box";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { DeviceModelId } from "@ledgerhq/devices";
import { Link } from "@ledgerhq/react-ui";

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

type TransactionConfirmFields = SolanaFamily["transactionConfirmFields"];
type TitleComponent = NonNullable<NonNullable<TransactionConfirmFields>["title"]>;

const transactionConfirmFields: TransactionConfirmFields = {
  title: Title,
};

export default transactionConfirmFields;
