/* @flow */
import React, { useState, useCallback } from "react";
import { View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import Icon from "react-native-vector-icons/dist/Feather";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";

import { accountAndParentScreenSelector } from "../../reducers/accounts";
import Touchable from "../../components/Touchable";
import BottomModal from "../../components/BottomModal";
import Wrench from "../../icons/Wrench";
import colors from "../../colors";
import TokenContractAddress from "./TokenContractAddress";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: ?(Account | TokenAccount),
  parentAccount: ?Account,
};

const AccountHeaderRight = ({ navigation, account, parentAccount }: Props) => {
  const [isOpened, setOpened] = useState(false);

  const toggleModal = useCallback(() => setOpened(!isOpened), [isOpened]);
  const closeModal = () => setOpened(false);

  if (!account) return null;

  if (account.type === "TokenAccount" && parentAccount) {
    return (
      <>
        <Touchable event="ShowContractAddress" onPress={toggleModal}>
          <View style={{ marginRight: 16 }}>
            <Icon name="file-text" size={20} color={colors.grey} />
          </View>
        </Touchable>
        <BottomModal
          id="ContractAddress"
          isOpened={isOpened}
          preventBackdropClick={false}
          onClose={closeModal}
        >
          <TokenContractAddress
            account={account}
            parentAccount={parentAccount}
            onClose={closeModal}
          />
        </BottomModal>
      </>
    );
  }

  if (account.type === "Account") {
    return (
      <Touchable
        event="AccountGoSettings"
        onPress={() => {
          navigation.navigate("AccountSettings", {
            accountId: account.id,
          });
        }}
      >
        <View style={{ marginRight: 16 }}>
          <Wrench size={16} color={colors.grey} />
        </View>
      </Touchable>
    );
  }

  return null;
};

export default connect(accountAndParentScreenSelector)(AccountHeaderRight);
