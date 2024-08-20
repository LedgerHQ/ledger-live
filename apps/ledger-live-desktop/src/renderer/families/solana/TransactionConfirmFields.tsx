import React, { useMemo } from "react";
import { getDeviceTransactionConfig } from "@ledgerhq/live-common/transaction/index";
import { SolanaFamily } from "./types";
import Alert from "~/renderer/components/Alert";
import { Trans } from "react-i18next";
import ConfirmTitle from "~/renderer/components/TransactionConfirm/ConfirmTitle";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Box from "~/renderer/components/Box";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";

const Title: TitleComponent = props => {
  const { transaction, account, parentAccount, status } = props;
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

  if (transaction.model.commandDescriptor?.command.kind === "token.transfer") {
    return (
      <Box
        flexDirection="column"
        alignItems="center"
        gap={4}
        mb={4}
        justifyContent="center"
        className="title-test-transfer"
      >
        <ConfirmTitle title={undefined} typeTransaction={typeTransaction} {...props} />
        <Alert type="warning">
          <Trans i18nKey="solana.token.transferWarning">
            <LinkWithExternalIcon
              color="palette.warning.c60"
              onClick={() => openURL(transferTokenHelpUrl)}
            />
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
  // footer: Footer, // is not shown without manifestId
  // fieldComponents,
  title: Title,
};

export default transactionConfirmFields;
