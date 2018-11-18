/* @flow */
import React, { PureComponent } from "react";
import { ScrollView, View, StyleSheet, SafeAreaView } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { Privacy } from "../../../reducers/settings";
import type { T } from "../../../types/common";
import Button from "../../../components/Button";
import PasswordInput from "../../../components/PasswordInput";

type Props = {
  t: T,
  setPrivacy: ($Shape<Privacy>) => void,
  navigation: NavigationScreenProp<{ goBack: () => void }>,
};
type State = {
  password: string,
  secureTextEntry: boolean,
};

class PasswordAdd extends PureComponent<Props, State> {
  static navigationOptions = {
    title: i18next.t("auth.addPassword.title"),
  };

  state = {
    password: "",
    secureTextEntry: true,
  };

  onChange = (password: string) => {
    this.setState({ password });
  };
  toggleSecureTextEntry = () => {
    const { secureTextEntry } = this.state;
    this.setState({ secureTextEntry: !secureTextEntry });
  };
  onSubmit = () => {
    const { navigation } = this.props;
    const { password } = this.state;
    navigation.navigate("ConfirmPassword", { password });
  };

  render() {
    const { t } = this.props;
    const { secureTextEntry } = this.state;
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.root}>
          <PasswordInput
            onChange={this.onChange}
            onSubmit={this.onSubmit}
            toggleSecureTextEntry={this.toggleSecureTextEntry}
            secureTextEntry={secureTextEntry}
            placeholder={t("auth.addPassword.placeholder")}
          />
          <View style={styles.flex}>
            <Button
              title={t("common.confirm")}
              type="primary"
              onPress={this.onSubmit}
              containerStyle={[styles.buttonContainer]}
              titleStyle={[styles.buttonTitle]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default translate()(PasswordAdd);

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
