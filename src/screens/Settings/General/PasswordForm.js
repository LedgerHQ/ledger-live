/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { translate } from "react-i18next";
import type { T } from "../../../types/common";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import KeyboardView from "../../../components/KeyboardView";
import TranslatedError from "../../../components/TranslatedError";
import PasswordInput from "../../../components/PasswordInput";
import colors from "../../../colors";

type Props = {
  t: T,
  onChange: string => void,
  onSubmit: () => void,
  error?: ?Error,
  placeholder: string,
};

type State = {
  secureTextEntry: boolean,
};

class PasswordForm extends PureComponent<Props, State> {
  state = {
    secureTextEntry: true,
  };

  toggleSecureTextEntry = () => {
    const { secureTextEntry } = this.state;
    this.setState({ secureTextEntry: !secureTextEntry });
  };

  render() {
    const { t, onChange, onSubmit, error, placeholder } = this.props;
    const { secureTextEntry } = this.state;
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardView>
          <PasswordInput
            inline
            autoFocus
            error={error}
            onChange={onChange}
            onSubmit={onSubmit}
            toggleSecureTextEntry={this.toggleSecureTextEntry}
            secureTextEntry={secureTextEntry}
            placeholder={placeholder}
          />
          {error && (
            <LText style={styles.errorStyle}>
              <TranslatedError error={error} />
            </LText>
          )}
          <View style={styles.footer}>
            <Button
              title={t("common.confirm")}
              type="primary"
              onPress={onSubmit}
              containerStyle={styles.buttonContainer}
              titleStyle={styles.buttonTitle}
              secureTextEntry={secureTextEntry}
              disabled={!!error}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

export default translate()(PasswordForm);

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
  footer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  errorStyle: {
    color: colors.alert,
    marginHorizontal: 16,
    fontSize: 12,
  },
});
