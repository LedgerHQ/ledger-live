// @flow
import invariant from "invariant";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type {
  AccountLike,
  Account,
  Transaction,
  Unit,
} from "@ledgerhq/live-common/lib/types";

import type { BigNumber } from "bignumber.js";

import {
  shortAddressPreview,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import {
  formatVotes,
  useTronSuperRepresentatives,
} from "@ledgerhq/live-common/lib/families/tron/react";

import {
  DataRow,
  DataRowUnitValue,
} from "../../components/ValidateOnDeviceDataRow";
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
  greyText: {
    color: colors.grey,
  },
  lineLabel: { justifyContent: "flex-start" },
  validatorLabel: { fontSize: 12, color: colors.grey },
});

const InfoSection = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "tron", "tron transaction");

  switch (transaction.mode) {
    case "claimReward":
    case "unfreeze":
    case "freeze":
      return (
        <DataRow>
          <Info size={22} color={colors.live} />
          <LText
            semiBold
            style={[styles.text, styles.infoText]}
            numberOfLines={2}
          >
            <Trans
              i18nKey={`ValidateOnDevice.infoWording.${transaction.mode}`}
              values={{ resource: (transaction.resource || "").toLowerCase() }}
            />
          </LText>
        </DataRow>
      );
    default:
      return null;
  }
};

const Pre = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "tron", "tron transaction");

  const { votes, resource } = transaction;

  const sp = useTronSuperRepresentatives();
  const formattedVotes =
    votes && votes.length > 0 ? formatVotes(votes, sp) : null;

  return (
    <>
      {resource && (
        <DataRow label="Resource">
          <LText semiBold style={styles.text}>
            {resource.slice(0, 1).toUpperCase() +
              resource.slice(1).toLowerCase()}
          </LText>
        </DataRow>
      )}

      {formattedVotes ? (
        <>
          <DataRow>
            <LText
              style={[styles.text, styles.greyText, { textAlign: "left" }]}
            >
              <Trans i18nKey="ValidateOnDevice.name" />
            </LText>
            <LText style={[styles.text, styles.greyText]}>
              <Trans i18nKey="ValidateOnDevice.votes" />
            </LText>
          </DataRow>

          {formattedVotes.map(({ address, voteCount, validator }) => (
            <DataRow key={address}>
              <View style={styles.lineLabel}>
                <LText semiBold>{shortAddressPreview(address)}</LText>
                <LText style={styles.validatorLabel}>
                  {validator && validator.name}
                </LText>
              </View>
              <LText semiBold style={styles.text}>
                {voteCount}
              </LText>
            </DataRow>
          ))}
        </>
      ) : null}
    </>
  );
};

const Post = ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  t: *,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);

  invariant(transaction.family === "tron", "tron transaction");

  const { mode } = transaction;

  const from =
    account.type === "ChildAccount"
      ? account.address
      : mainAccount.freshAddress;

  return (
    <>
      {mode === "freeze" || mode === "unfreeze" ? (
        <DataRow label={mode === "freeze" ? "Freeze To" : "Delegate To"}>
          <LText semiBold style={styles.text}>
            {mainAccount.freshAddress}
          </LText>
        </DataRow>
      ) : null}

      {mode !== "send" ? (
        <DataRow label="From Address">
          <LText semiBold style={styles.text}>
            {from}
          </LText>
        </DataRow>
      ) : null}

      <InfoSection transaction={transaction} />
    </>
  );
};

const Fees = ({
  transaction,
  mainAccountUnit,
  estimatedFees,
}: {
  transaction: Transaction,
  mainAccountUnit: Unit,
  estimatedFees: BigNumber,
}) => {
  invariant(transaction.family === "tron", "tron transaction");

  switch (transaction.mode) {
    case "send":
      return null;
    default:
      return (
        <DataRowUnitValue
          label={<Trans i18nKey="send.validation.fees" />}
          unit={mainAccountUnit}
          value={estimatedFees}
        />
      );
  }
};

export default {
  pre: Pre,
  post: Post,
  fees: Fees,
  disableFees: () => true,
};
