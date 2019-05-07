/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TextInput } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { translate } from "react-i18next";
import i18next from "i18next";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/bridge/RippleJSBridge";
import { getAccountBridge } from "../../bridge";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import { accountScreenSelector } from "../../reducers/accounts";

import colors from "../../colors";
import type { T } from "../../types/common";
import { track } from "../../analytics";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
  t: T,
};

type State = {
  tag: ?BigNumber,
};

const uint32maxPlus1 = BigNumber(2).pow(32);

class RippleEditTag extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("send.summary.tag"),
    headerLeft: null,
  };

  onTagFieldFocus = () => track("SendTagFieldFocusedXRP");

  constructor({ account, navigation }) {
    super();
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    this.state = {
      tag: bridge.getTransactionExtra(account, transaction, "tag"),
    };
  }
  onChangeTag = (str: string) => {
    const tagNumeric = BigNumber(str.replace(/[^0-9]/g, ""));
    if (
      tagNumeric.isInteger() &&
      tagNumeric.isPositive() &&
      tagNumeric.lt(uint32maxPlus1)
    ) {
      this.setState({ tag: tagNumeric });
    } else {
      this.setState({ tag: undefined });
    }
  };

  onValidateText = () => {
    const { navigation, account } = this.props;
    const { tag } = this.state;
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: bridge.editTransactionExtra(
        account,
        transaction,
        "tag",
        tag && tag.toNumber(),
      ),
    });
  };

  render() {
    const { tag } = this.state;
    const { t } = this.props;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardView style={styles.body}>
          <ScrollView
            contentContainerStyle={styles.root}
            keyboardShouldPersistTaps="always"
          >
            <TextInput
              allowFontScaling={false}
              autoFocus
              style={styles.textInputAS}
              defaultValue={tag ? tag.toString() : ""}
              keyboardType="numeric"
              returnKeyType="done"
              onChangeText={this.onChangeTag}
              onFocus={this.onTagFieldFocus}
              onSubmitEditing={this.onValidateText}
            />

            <View style={styles.flex}>
              <Button
                event="RippleEditTag"
                type="primary"
                title={t("send.summary.validateTag")}
                onPress={this.onValidateText}
                containerStyle={styles.buttonContainer}
              />
            </View>
          </ScrollView>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flexDirection: "column",
    flex: 1,
    backgroundColor: colors.white,
  },
  textInputAS: {
    padding: 16,
    fontSize: 30,
    color: colors.darkBlue,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(translate()(RippleEditTag));
