/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { withTranslation } from "react-i18next";
import type { T } from "../../../types/common";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import KeyboardView from "../../../components/KeyboardView";
import TranslatedError from "../../../components/TranslatedError";
import PasswordInput from "../../../components/PasswordInput";

type Props = {
  t: T,
  onChange: string => void,
  onSubmit: () => void,
  error?: ?Error,
  placeholder: string,
  value: string,
};

type State = {
  secureTextEntry: boolean,
};

const forceInset = { bottom: "always" };

class PasswordForm extends PureComponent<Props, State> {
  state = {
    secureTextEntry: true,
  };

  toggleSecureTextEntry = () => {
    const { secureTextEntry } = this.state;
    this.setState({ secureTextEntry: !secureTextEntry });
  };

  render() {
    const { t, onChange, onSubmit, error, placeholder, value } = this.props;
    const { secureTextEntry } = this.state;
    return (
      <SafeAreaView forceInset={forceInset} style={styles.root}>
        <KeyboardView>
          <View style={styles.body}>
            <PasswordInput
              inline
              autoFocus
              error={error}
              onChange={onChange}
              onSubmit={onSubmit}
              toggleSecureTextEntry={this.toggleSecureTextEntry}
              secureTextEntry={secureTextEntry}
              placeholder={placeholder}
              password={value}
            />
          </View>
          {error && (
            <LText style={styles.errorStyle} color="alert">
              <TranslatedError error={error} />
            </LText>
          )}
          <View style={styles.footer}>
            <Button
              event="SubmitPassword"
              title={t("common.confirm")}
              type="primary"
              onPress={onSubmit}
              containerStyle={styles.buttonContainer}
              titleStyle={styles.buttonTitle}
              disabled={!!error || value.length === 0}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

export default withTranslation()(PasswordForm);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    paddingVertical: 8,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  buttonTitle: {
    fontSize: 16,
  },
  footer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  errorStyle: {
    marginHorizontal: 16,
    fontSize: 12,
  },
});
