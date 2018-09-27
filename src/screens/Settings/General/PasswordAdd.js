/* @flow */
import React, { PureComponent } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { setPrivacy } from "../../../actions/settings";
import type { Privacy } from "../../../reducers/settings";
import type { T } from "../../../types/common";
import Button from "../../../components/Button";
import LText from "../../../components/LText";

type Props = {
  t: T,
  setPrivacy: ($Shape<Privacy>) => void,
  navigation: NavigationScreenProp<{ goBack: () => void }>,
};
type State = {
  password: string,
};

const mapDispatchToProps = {
  setPrivacy,
};

class PasswordAdd extends PureComponent<Props, State> {
  static navigationOptions = {
    title: "Live Password",
  };

  state = {
    password: "",
  };

  onChangeText = (password: string) => {
    this.setState({ password });
  };

  onPasswordSave = () => {
    const { navigation, setPrivacy } = this.props;
    const { password } = this.state;
    setPrivacy({
      value: password,
      authSecurityEnabled: true,
    });
    navigation.goBack();
  };

  render() {
    const { t } = this.props;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.root}>
          <View style={styles.textContainer}>
            <LText bold style={styles.textStyle}>
              {t("auth.addPassword.title")}
            </LText>
            <LText style={styles.textStyle}>{t("auth.addPassword.desc")}</LText>
          </View>
          <TextInput
            autoFocus
            style={styles.textInputAS}
            placeholder={t("auth.addPassword.placeholder")}
            returnKeyType="done"
            keyboardType="numeric"
            maxLength={7}
            onChangeText={this.onChangeText}
            onSubmitEditing={this.onPasswordSave}
          />
          <View style={styles.flex}>
            <Button
              title={t("common.apply")}
              type="primary"
              onPress={this.onPasswordSave}
              containerStyle={[styles.buttonContainer]}
              titleStyle={[styles.buttonTitle]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default compose(
  connect(
    null,
    mapDispatchToProps,
  ),
  translate(),
)(PasswordAdd);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  textInputAS: {
    padding: 16,
    fontSize: 16,
  },
  textContainer: {
    margin: 16,
  },
  textStyle: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  buttonTitle: {
    fontSize: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
