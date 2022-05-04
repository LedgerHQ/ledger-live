import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { withTranslation, Trans } from "react-i18next";
import LText from "../../../components/LText";
import KeyboardView from "../../../components/KeyboardView";
import TranslatedError from "../../../components/TranslatedError";
import PasswordInput from "../../../components/PasswordInput";
import { withTheme } from "../../../colors";
import Button from "../../../components/wrappedUi/Button";

type Props = {
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: Error;
  placeholder: string;
  value: string;
  colors: any;
};

type State = {
  secureTextEntry: boolean;
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
    const {
      onChange,
      onSubmit,
      error,
      placeholder,
      value,
      colors,
    } = this.props;
    const { secureTextEntry } = this.state;
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
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
              testID="password-text-input"
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
              type={"main"}
              onPress={onSubmit}
              disabled={!!error || value.length === 0}
            >
              <Trans i18nKey="common.confirm" />
            </Button>
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

export default withTheme(withTranslation()(PasswordForm));

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
    padding: 16,
  },
  errorStyle: {
    marginHorizontal: 16,
    fontSize: 12,
  },
});
