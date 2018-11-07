/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import { withNavigation } from "react-navigation";
import Button from "../../components/Button";
import IconSend from "../../icons/Send";
import IconReceive from "../../icons/Receive";

type Props = {
  accountId: string,
  navigation: *,
  t: *,
};

class AccountActions extends PureComponent<Props> {
  render() {
    const { navigation, accountId, t } = this.props;

    return (
      <View style={styles.root}>
        <Button
          type="primary"
          IconLeft={IconSend}
          onPress={() =>
            navigation.navigate("SendSelectRecipient", { accountId })
          }
          title={t("account.send")}
          containerStyle={styles.btn1}
        />
        <Button
          type="primary"
          IconLeft={IconReceive}
          onPress={() =>
            navigation.navigate("ReceiveConnectDevice", { accountId })
          }
          title={t("account.receive")}
          containerStyle={styles.btn2}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  btn1: {
    flex: 1,
    marginRight: 8,
  },
  btn2: {
    marginLeft: 8,
    flex: 1,
  },
});

export default withNavigation(translate()(AccountActions));
