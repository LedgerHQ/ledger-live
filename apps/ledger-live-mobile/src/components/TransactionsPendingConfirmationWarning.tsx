import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import type { AccountLike } from "@ledgerhq/types-live";
import { Trans } from "react-i18next";
import { useTheme } from "styled-components/native";
import { isAccountBalanceUnconfirmed } from "@ledgerhq/live-common/account/helpers";
import { areSomeAccountsBalanceUnconfirmedSelector } from "../reducers/accounts";
import QueuedDrawer from "./QueuedDrawer";
import LText from "./LText";
import Circle from "./Circle";
import ClockIcon from "../icons/Clock";
import IconInfo from "../icons/Info";
import { rgba } from "../colors";

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

const TransactionsPendingConfirmationWarningContent = () => {
  const { colors } = useTheme();
  const [isModalOpened, setIsModalOpened] = useState(false);
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity hitSlop={hitSlop} onPress={() => setIsModalOpened(true)}>
        <ClockIcon color={colors.neutral.c70} size={12} />
      </TouchableOpacity>
      <QueuedDrawer
        style={styles.modal}
        isRequestingToBeOpened={isModalOpened}
        onClose={() => setIsModalOpened(false)}
      >
        <Circle style={styles.circle} bg={rgba(colors.primary.c80, 0.1)} size={56}>
          <IconInfo size={24} color={colors.primary.c80} />
        </Circle>
        <LText secondary semiBold style={styles.modalTitle}>
          <Trans i18nKey={"portfolio.transactionsPendingConfirmation.title"} />
        </LText>
        <LText style={styles.modalDesc} color="neutral.c60">
          <Trans i18nKey={"portfolio.transactionsPendingConfirmation.desc"} />
        </LText>
      </QueuedDrawer>
    </View>
  );
};

export const TransactionsPendingConfirmationWarningForAccount = ({
  maybeAccount,
}: {
  maybeAccount: AccountLike;
}) => {
  return isAccountBalanceUnconfirmed(maybeAccount) ? (
    <TransactionsPendingConfirmationWarningContent />
  ) : null;
};

export const TransactionsPendingConfirmationWarningAllAccounts = () => {
  const areSomeAccountsBalanceUnconfirmed = useSelector(areSomeAccountsBalanceUnconfirmedSelector);
  return areSomeAccountsBalanceUnconfirmed ? (
    <TransactionsPendingConfirmationWarningContent />
  ) : null;
};

const styles = StyleSheet.create({
  wrapper: {
    display: "flex",
    alignItems: "center",
    marginLeft: 8,
  },
  circle: {
    alignSelf: "center",
    marginBottom: 24,
  },
  modal: {
    paddingVertical: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  modalTitle: {
    textAlign: "center",
    fontSize: 18,
  },
  modalDesc: {
    marginTop: 12,
    paddingHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
  },
});
