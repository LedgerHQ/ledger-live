import React, { useMemo } from "react";
import { TFunction } from "i18next";
import { withTranslation } from "react-i18next";
import {
  Account,
  AccountLike,
  SubAccount,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import Text from "~/renderer/components/Text";

type Props = {
  t: TFunction;
  Title:
    | React.ComponentType<{
        account: Account | SubAccount;
        parentAccount: Account | null | undefined;
        transaction: TransactionCommon;
        status: TransactionStatusCommon;
      }>
    | undefined;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  status: TransactionStatus;
  transaction: Transaction;
  typeTransaction: string | undefined;
};

const ConfirmTitle = ({
  t,
  Title,
  account,
  parentAccount,
  status,
  transaction,
  typeTransaction,
}: Props) => {
  const description: string = useMemo(() => {
    if (typeTransaction === "Approve") return t("approve.description");
    else return t("sign.description");
  }, [t, typeTransaction]);

  if (Title) {
    return (
      <Title
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        status={status}
      />
    );
  }
  return (
    <Text ff={"Inter|Medium"} textAlign={"center"} fontSize={22} marginBottom={12}>
      {description}
    </Text>
  );
};

export default withTranslation()(ConfirmTitle);
