/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { compose } from "redux";
import { Trans, translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import Icon from "react-native-vector-icons/dist/Feather";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import Button from "../../components/Button";
import TextInput from "../../components/TextInput";
import KeyboardView from "../../components/KeyboardView";
import LText, { getFontStyle } from "../../components/LText";
import TranslatedError from "../../components/TranslatedError";
import { getAccountBridge } from "../../bridge";

import colors from "../../colors";

class FooterError extends PureComponent<{ error: Error }> {
  render() {
    const { error } = this.props;

    return (
      <LText style={styles.error} numberOfLines={2}>
        <Icon color={colors.alert} size={16} name="alert-triangle" />{" "}
        <TranslatedError error={error} />
      </LText>
    );
  }
}

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  updateAccount: Function,
  account: Account,
};

type State = {
  accountNode: string,
  error: ?Error,
};

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

const mapDispatchToProps = {
  updateAccount,
};

class EditAccountNode extends PureComponent<Props, State> {
  state = {
    accountNode: "",
    error: null,
  };

  static navigationOptions = {
    title: i18next.t("account.settings.endpointConfig.title"),
  };

  onChangeText = (accountNode: string) => {
    this.setState({ accountNode });
  };

  onNodeEndEditing = async () => {
    const { updateAccount, account, navigation } = this.props;
    const { accountNode } = this.state;

    if (!accountNode.length) {
      navigation.goBack();
    }

    const isValid = await this.validateNode();

    if (isValid) {
      updateAccount({
        ...account,
        endpointConfig: accountNode,
      });
      navigation.goBack();
    }
  };

  validateNode = async () => {
    const { account } = this.props;
    const { accountNode } = this.state;

    const bridge = getAccountBridge(account);

    try {
      if (bridge.validateEndpointConfig) {
        await bridge.validateEndpointConfig(accountNode);
      }
      return true;
    } catch (error) {
      this.setState({ error });
      return false;
    }
  };

  render() {
    const { account } = this.props;
    const { error } = this.state;
    const bridge = getAccountBridge(account);

    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardView style={styles.body}>
          <ScrollView
            contentContainerStyle={styles.root}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              autoFocus
              style={styles.textInputAS}
              defaultValue={
                account.endpointConfig ||
                (bridge.getDefaultEndpointConfig &&
                  bridge.getDefaultEndpointConfig()) ||
                ""
              }
              returnKeyType="done"
              onChangeText={accountNode =>
                this.setState({ accountNode, error: null })
              }
              onSubmitEditing={this.onNodeEndEditing}
              clearButtonMode="while-editing"
              keyboardType="url"
            />
            <View style={styles.flex}>
              {error ? <FooterError error={error} /> : null}
              <Button
                event="EditAccountNodeApply"
                type="primary"
                title={<Trans i18nKey="common.apply" />}
                onPress={this.onNodeEndEditing}
                containerStyle={styles.buttonContainer}
              />
            </View>
          </ScrollView>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(EditAccountNode);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    flexDirection: "column",
    flex: 1,
    backgroundColor: colors.white,
  },
  textInputAS: {
    padding: 16,
    marginRight: 8,
    fontSize: 20,
    color: colors.darkBlue,
    ...getFontStyle({ semiBold: true }),
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
  error: {
    alignSelf: "center",
    color: colors.alert,
    fontSize: 14,
    marginBottom: 10,
  },
});
