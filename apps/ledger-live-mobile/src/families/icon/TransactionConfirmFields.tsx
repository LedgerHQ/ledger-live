import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  formatVotes,
  useIconPublicRepresentatives,
} from "@ledgerhq/live-common/families/icon/react";
import { useTheme } from "@react-navigation/native";
import {
  DataRow,
  HeaderRow,
  ValidatorField,
} from "../../components/ValidateOnDeviceDataRow";
import LText from "../../components/LText";
import Info from "../../icons/Info";
import { localeSelector } from "../../reducers/settings";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/helpers";

const styles = StyleSheet.create({
  infoText: {
    textAlign: "left",
    marginLeft: 8,
  },
  text: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

const Warning = ({ transaction }: { transaction: Transaction; }) => {
  const { colors } = useTheme();
  invariant(transaction.family === "icon", "icon transaction");

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
            color="live"
            numberOfLines={2}
          >
            <Trans
              i18nKey={`ValidateOnDevice.infoWording.${transaction.mode}`}
              values={{
                resource: (transaction.recipient || "").toLowerCase(),
              }}
            />
          </LText>
        </DataRow>
      );
    default:
      return null;
  }
};


const IconFreesField = ({transaction }: { transaction: Transaction}) => {
  const locale = useSelector(localeSelector);
  invariant(transaction.family === "icon", "icon transaction");
  const { fees } = transaction;
  return (
    fees && (
      <DataRow label="Fees">
        <LText semiBold style={styles.text}>
          {Number(fees || 0).toLocaleString(locale)}
        </LText>
      </DataRow>
    )
  );
};

function IconVotesField({ account, transaction }: { transaction: Transaction, account: IconAccount; }) {
  invariant(transaction.family === "icon", "icon transaction");
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const { votes } = transaction;
  const pr = useIconPublicRepresentatives(account.currency);
  const formattedVotes =
    votes && votes.length > 0 ? formatVotes(votes, pr) : null;
  return formattedVotes ? (
    <>
      <HeaderRow
        label={t("ValidateOnDevice.name")}
        value={t("ValidateOnDevice.votes")}
      />
      {formattedVotes.map(({ address, value, validator }) => (
        <ValidatorField
          address={address || ''}
          name={validator?.name ?? address ?? ''}
          amount={Number(value).toLocaleString(locale)}
        />
      ))}
    </>
  ) : null;
}

const fieldComponents = {
  "icon.votes": IconVotesField,
  "icon.fees": IconFreesField

};
export default {
  fieldComponents,
  warning: Warning,
  disableFees: () => true,
};
