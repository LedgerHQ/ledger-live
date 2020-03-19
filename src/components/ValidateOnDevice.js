// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans, translate } from "react-i18next";
import type {
  Account,
  AccountLike,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import type { DeviceModelId } from "@ledgerhq/devices";
import { getDeviceModel } from "@ledgerhq/devices";

import colors from "../colors";
import LText from "./LText";
import DeviceNanoAction from "./DeviceNanoAction";
import VerifyAddressDisclaimer from "./VerifyAddressDisclaimer";
import getWindowDimensions from "../logic/getWindowDimensions";
import perFamilyTransactionConfirmFields from "../generated/TransactionConfirmFields";
import { DataRowUnitValue } from "./ValidateOnDeviceDataRow";

type Props = {
  modelId: DeviceModelId,
  wired: boolean,
  status: TransactionStatus,
  transaction: Transaction,
  account: AccountLike,
  parentAccount: ?Account,
  t: *,
};

const { width } = getWindowDimensions();

const ValidateOnDevice = ({
  modelId,
  wired,
  account,
  parentAccount,
  status,
  transaction,
  t,
}: Props) => {
  const { amount, estimatedFees } = status;
  const mainAccount = getMainAccount(account, parentAccount);
  const mainAccountUnit = getAccountUnit(mainAccount);
  const unit = getAccountUnit(account);
  const r = perFamilyTransactionConfirmFields[mainAccount.currency.family];
  const Pre = r && r.pre;
  const Post = r && r.post;
  const transRecipientWording = t(
    `ValidateOnDevice.recipientWording.${transaction.mode || "send"}`,
  );
  const recipientWording =
    transRecipientWording !==
    `ValidateOnDevice.recipientWording.${transaction.mode || "send"}`
      ? transRecipientWording
      : t("ValidateOnDevice.recipientWording.send");

  const transTitleWording = t(
    `ValidateOnDevice.title.${transaction.mode || "send"}`,
    getDeviceModel(modelId),
  );
  const titleWording =
    transTitleWording !== `ValidateOnDevice.title.${transaction.mode || "send"}`
      ? transTitleWording
      : t("ValidateOnDevice.title.send", getDeviceModel(modelId));

  return (
    <View style={styles.root}>
      <View style={styles.innerContainer}>
        <View style={styles.picture}>
          <DeviceNanoAction
            modelId={modelId}
            wired={wired}
            action="accept"
            width={width * 0.8}
            screen="validation"
          />
        </View>
        <View style={styles.titleContainer}>
          <LText secondary semiBold style={styles.title}>
            {titleWording}
          </LText>
        </View>

        <View style={styles.dataRows}>
          {Pre ? (
            <Pre
              account={account}
              parentAccount={parentAccount}
              transaction={transaction}
              status={status}
            />
          ) : null}

          {!amount.isZero() ? (
            <DataRowUnitValue
              label={<Trans i18nKey="send.validation.amount" />}
              unit={unit}
              value={amount}
            />
          ) : null}
          {!estimatedFees.isZero() ? (
            <DataRowUnitValue
              label={<Trans i18nKey="send.validation.fees" />}
              unit={mainAccountUnit}
              value={estimatedFees}
            />
          ) : null}

          {Post ? (
            <Post
              account={account}
              parentAccount={parentAccount}
              transaction={transaction}
              status={status}
            />
          ) : null}
        </View>
      </View>

      <VerifyAddressDisclaimer
        text={
          <Trans
            i18nKey="ValidateOnDevice.warning"
            values={{ recipientWording }}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  dataRows: {
    marginVertical: 24,
    alignSelf: "stretch",
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  picture: {
    marginBottom: 40,
  },
  titleContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    color: colors.darkBlue,
    textAlign: "center",
  },
});

export default translate()(ValidateOnDevice);
