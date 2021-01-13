// @flow

import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { isAccountBalanceUnconfirmed } from "@ledgerhq/live-common/lib/account";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { accountsSelector } from "../reducers/accounts";
import BottomModal from "./BottomModal";
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

const TransactionsPendingConfirmationWarning = ({
  maybeAccount,
}: {
  maybeAccount?: AccountLike,
}) => {
  const { colors } = useTheme();
  let accounts = useSelector(accountsSelector);
  const [isModalOpened, setIsModalOpened] = useState(false);

  accounts = maybeAccount ? [maybeAccount] : accounts;
  return accounts.some(isAccountBalanceUnconfirmed) ? (
    <View style={styles.wrapper}>
      <TouchableOpacity
        hitSlop={hitSlop}
        onPress={() => setIsModalOpened(true)}
      >
        <ClockIcon color={colors.grey} size={12} />
      </TouchableOpacity>
      <BottomModal
        style={styles.modal}
        isOpened={isModalOpened}
        onClose={() => setIsModalOpened(false)}
      >
        <Circle style={styles.circle} bg={rgba(colors.live, 0.1)} size={56}>
          <IconInfo size={24} color={colors.live} />
        </Circle>
        <LText secondary semiBold style={styles.modalTitle}>
          <Trans i18nKey={"portfolio.transactionsPendingConfirmation.title"} />
        </LText>
        <LText style={styles.modalDesc} color="smoke">
          <Trans i18nKey={"portfolio.transactionsPendingConfirmation.desc"} />
        </LText>
      </BottomModal>
    </View>
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

export default TransactionsPendingConfirmationWarning;
