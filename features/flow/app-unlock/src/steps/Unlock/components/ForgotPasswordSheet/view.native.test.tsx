import { I18nTestProvider } from "@shared/i18n/testing";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import type { ForgotPasswordSheetProps } from "./types";
import { ForgotPasswordSheet } from "./view";

const mockSheet = { present: jest.fn(), dismiss: jest.fn() };

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const ref = {
    get current() {
      return mockSheet;
    },
    set current(_: unknown) {},
  };
  const useBottomSheetRef = () => ref;

  return new Proxy(actual, {
    get: (target, prop) => (prop === "useBottomSheetRef" ? useBottomSheetRef : target[prop]),
  });
});

const COPY = {
  en: {
    translation: {
      "appLock.unlock.forgotPasswordSheet.title": "Forgot your password?",
      "appLock.unlock.forgotPasswordSheet.description": "Reinstall the app to start again.",
      "appLock.unlock.forgotPasswordSheet.cta": "Got it",
    },
  },
};

const SHEET = "app-lock-forgot-password-sheet";
const DISMISS = "app-lock-forgot-password-dismiss";

const sheet = (props: ForgotPasswordSheetProps) => (
  <I18nTestProvider resources={COPY}>
    <ForgotPasswordSheet {...props} />
  </I18nTestProvider>
);

const renderSheet = (props: Partial<ForgotPasswordSheetProps> = {}) => {
  const onClose = jest.fn();
  const view = render(sheet({ isOpen: true, onClose, ...props }));

  return { ...view, onClose, user: userEvent.setup() };
};

const closeFromSheet = () =>
  act(() => {
    (screen.getByTestId(SHEET).props.onClose as () => void)();
  });

beforeEach(() => jest.clearAllMocks());

describe("ForgotPasswordSheet", () => {
  it("explains what forgetting the password means", () => {
    renderSheet();

    expect(screen.getByText("Forgot your password?")).toBeTruthy();
    expect(screen.getByText("Reinstall the app to start again.")).toBeTruthy();
    expect(screen.getByText("Got it")).toBeTruthy();
  });

  it("presents itself when opened and goes away when closed", () => {
    const { onClose, rerender } = renderSheet();

    expect(mockSheet.present).toHaveBeenCalledTimes(1);

    rerender(sheet({ isOpen: false, onClose }));

    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes from its button", async () => {
    const { onClose, user } = renderSheet();

    await user.press(screen.getByTestId(DISMISS));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
  });

  it("reports a close from the sheet itself once", () => {
    const { onClose } = renderSheet();

    closeFromSheet();
    closeFromSheet();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not report the close of a sheet that was never opened", () => {
    const { onClose } = renderSheet({ isOpen: false, bottomInset: 34 });

    closeFromSheet();

    expect(onClose).not.toHaveBeenCalled();
  });
});
