import { I18nTestProvider } from "@shared/i18n/testing";
import { act, render, screen } from "@testing-library/react-native";
import React from "react";
import { PASSWORD_MAX_LENGTH } from "../password";
import { PasswordField } from "./PasswordField";
import type { PasswordFieldProps } from "./types";

const FIELD = "password-field";

const COPY = {
  en: {
    translation: {
      "appLock.field.label": "Password",
      "appLock.field.reveal": "Show password",
      "appLock.field.hide": "Hide password",
      "appLock.unlock.retryBiometrics": "Use Face ID",
    },
  },
};

const renderField = (props: Partial<PasswordFieldProps> = {}) => {
  const onChangeText = jest.fn();
  render(
    <I18nTestProvider resources={COPY}>
      <PasswordField value="" onChangeText={onChangeText} testID={FIELD} {...props} />
    </I18nTestProvider>,
  );
  return { onChangeText };
};

const field = () => screen.getByTestId(FIELD);
const suffix = () =>
  field().props.suffix as React.ReactElement<Record<string, unknown>> | undefined;
const pressSuffix = () => {
  const onPress = suffix()?.props.onPress;

  if (typeof onPress !== "function") {
    throw new Error("The field shows no button to press");
  }

  act(() => {
    onPress();
  });
};

describe("PasswordField", () => {
  it("masks what is typed and caps it at the password maximum", () => {
    renderField();

    expect(field().props.label).toBe("Password");
    expect(field().props.secureTextEntry).toBe(true);
    expect(field().props.maxLength).toBe(PASSWORD_MAX_LENGTH);
    expect(field().props.autoCorrect).toBe(false);
    expect(field().props.autoCapitalize).toBe("none");
  });

  it("forwards what is typed", () => {
    const { onChangeText } = renderField();

    act(() => {
      field().props.onChangeText("secret1");
    });

    expect(onChangeText).toHaveBeenCalledWith("secret1");
  });

  it("reveals the password and masks it again from its toggle", () => {
    renderField();

    expect(suffix()?.props.testID).toBe(`${FIELD}-reveal`);
    expect(suffix()?.props.accessibilityLabel).toBe("Show password");

    pressSuffix();
    expect(field().props.secureTextEntry).toBe(false);
    expect(suffix()?.props.accessibilityLabel).toBe("Hide password");

    pressSuffix();
    expect(field().props.secureTextEntry).toBe(true);
  });

  it("offers no toggle when revealing is not allowed", () => {
    renderField({ canReveal: false });

    expect(suffix()).toBeUndefined();
  });

  it("offers biometrics instead of the toggle when a retry is possible", () => {
    const onBiometrics = jest.fn();
    renderField({ onBiometrics, biometricsKind: "FaceID" });

    expect(suffix()?.props.testID).toBe(`${FIELD}-biometrics`);
    expect(suffix()?.props.accessibilityLabel).toBe("Use Face ID");

    pressSuffix();
    expect(onBiometrics).toHaveBeenCalledTimes(1);
    expect(field().props.secureTextEntry).toBe(true);
  });

  it("shows an error state with its helper text", () => {
    renderField({ hasError: true, helperText: "Wrong password" });

    expect(field().props.status).toBe("error");
    expect(field().props.helperText).toBe("Wrong password");
  });

  it.each([{ onBiometrics: undefined }, { onBiometrics: jest.fn() }])(
    "leaves its button without a test id when the field has none",
    ({ onBiometrics }) => {
      render(
        <I18nTestProvider resources={COPY}>
          <PasswordField value="" onChangeText={jest.fn()} onBiometrics={onBiometrics} />
        </I18nTestProvider>,
      );

      const button = screen.root.props.suffix as React.ReactElement<Record<string, unknown>>;
      expect(button.props.testID).toBeUndefined();
    },
  );

  it("stays neutral without an error", () => {
    renderField({ helperText: "At least 6 characters" });

    expect(field().props.status).toBeUndefined();
  });
});
