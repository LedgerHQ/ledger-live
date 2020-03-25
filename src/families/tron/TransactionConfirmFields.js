// @flow
import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import type {
  AccountLike,
  Account,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { Trans } from "react-i18next";
import { DataRow } from "../../components/ValidateOnDeviceDataRow";
import LText from "../../components/LText";
import Info from "../../icons/Info";
import colors from "../../colors";

const styles = StyleSheet.create({
  infoRow: {
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  infoText: {
    color: colors.live,
    textAlign: "left",
    marginLeft: 8,
  },
  text: {
    color: colors.darkBlue,
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

const InfoSection = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "tron", "tron transaction");

  switch (transaction.mode) {
    case "freeze":
      return (
        <DataRow>
          <Info size={22} color={colors.live} />
          <LText
            semiBold
            style={[styles.text, styles.infoText]}
            numberOfLines={2}
          >
            <Trans i18nKey="ValidateOnDevice.infoWording.freeze" />
          </LText>
        </DataRow>
      );
    case "claimReward":
    case "unfreeze":
    default:
      return null;
  }
};

const Post = ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);

  invariant(transaction.family === "tron", "tron transaction");

  return (
    <>
      <DataRow label={<Trans i18nKey="ValidateOnDevice.address" />}>
        <LText semiBold style={styles.text}>
          {account.type === "ChildAccount"
            ? account.address
            : mainAccount.freshAddress}
        </LText>
      </DataRow>
      {transaction.resource && (
        <DataRow label={<Trans i18nKey="ValidateOnDevice.resource" />}>
          <LText semiBold style={styles.text}>
            {transaction.resource}
          </LText>
        </DataRow>
      )}
      <InfoSection transaction={transaction} />
    </>
  );
};

const Pre = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "tron", "tron transaction");

  return null;
};

export default {
  pre: Pre,
  post: Post,
};
