/* @flow */
import React, { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import Touchable from "../../components/Touchable";
import Wrench from "../../icons/Wrench";
import colors from "../../colors";
import TokenContextualModal from "../Settings/Accounts/TokenContextualModal";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: ?(Account | TokenAccount),
  parentAccount: ?Account,
};

const AccountHeaderRight = ({ navigation, account, parentAccount }: Props) => {
  const [isOpened, setOpened] = useState(false);

  const toggleModal = useCallback(() => setOpened(!isOpened), [isOpened]);
  const closeModal = () => {
    setOpened(false);
  };

  useEffect(() => {
    if (!account) {
      navigation.navigate("Accounts");
    }
  }, [account, navigation]);

  if (!account) return null;

  if (account.type === "TokenAccount" && parentAccount) {
    return (
      <>
        <Touchable event="ShowContractAddress" onPress={toggleModal}>
          <View style={{ marginRight: 16 }}>
            <Icon name="ellipsis-h" size={20} color={colors.grey} />
          </View>
        </Touchable>
        <TokenContextualModal
          account={account}
          isOpened={isOpened}
          onClose={closeModal}
        />
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
