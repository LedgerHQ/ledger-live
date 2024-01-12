import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  formatVotes,
  useTronSuperRepresentatives,
} from "@ledgerhq/live-common/families/tron/react";
import { useTheme } from "@react-navigation/native";
import { DataRow, HeaderRow, ValidatorField } from "~/components/ValidateOnDeviceDataRow";
import LText from "~/components/LText";
import Info from "~/icons/Info";
import { useSettings } from "~/hooks";

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

const Warning = ({ transaction }: { transaction: Transaction }) => {
  const { colors } = useTheme();
  invariant(transaction.family === "tron", "tron transaction");

  switch (transaction.mode) {
    case "claimReward":
    case "unfreeze":
    case "freeze":
    case "legacyUnfreeze":
    case "unDelegateResource":
    case "withdrawExpireUnfreeze":
      return (
        <DataRow>
          <Info size={22} color={colors.live} />
          <LText semiBold style={[styles.text, styles.infoText]} color="live" numberOfLines={2}>
            <Trans
              i18nKey={`ValidateOnDevice.infoWording.${transaction.mode}`}
              values={{
                resource: (transaction.resource || "").toLowerCase(),
              }}
            />
          </LText>
        </DataRow>
      );

    default:
      return null;
  }
};

const TronResourceField = ({ transaction }: { transaction: Transaction }) => {
  invariant(transaction.family === "tron", "tron transaction");
  const { resource } = transaction;
  return (
    resource && (
      <DataRow label="Resource">
        <LText semiBold style={styles.text}>
          {resource.slice(0, 1).toUpperCase() + resource.slice(1).toLowerCase()}
        </LText>
      </DataRow>
    )
  );
};

function TronVotesField({ transaction }: { transaction: Transaction }) {
  invariant(transaction.family === "tron", "tron transaction");
  const { t } = useTranslation();
  const { locale } = useSettings();
  const { votes } = transaction;
  const sp = useTronSuperRepresentatives();
  const formattedVotes = votes && votes.length > 0 ? formatVotes(votes, sp) : null;
  return formattedVotes ? (
    <>
      <HeaderRow label={t("ValidateOnDevice.name")} value={t("ValidateOnDevice.votes")} />

      {formattedVotes.map(({ address, voteCount, validator }, i) => (
        <ValidatorField
          address={address}
          name={validator?.name ?? address}
          amount={voteCount.toLocaleString(locale)}
          key={`${address}-${i}`}
        />
      ))}
    </>
  ) : null;
}

const fieldComponents = {
  "tron.resource": TronResourceField,
  "tron.votes": TronVotesField,
};
export default {
  fieldComponents,
  warning: Warning,
  disableFees: () => true,
};
