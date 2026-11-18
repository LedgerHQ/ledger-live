import React from "react";
import { Linking } from "react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ReconnectSheet } from "./ReconnectSheet";
import type { ReconnectSheetProps } from "./ReconnectSheet.types";
import { reconnectSheetTestIds } from "./internals";

const COPY = {
  en: {
    translation: {
      "deviceOnboarding.setup.connection.reconnecting.title":
        "Reconnecting to your {{productName}}",
      "deviceOnboarding.setup.connection.reconnecting.description": "Keep it close",
      "deviceOnboarding.setup.connection.failed.title": "Couldn't connect to {{productName}}",
      "deviceOnboarding.setup.connection.failed.description": "Try again",
      "deviceOnboarding.setup.connection.failed.retryCta": "Try again",
      "deviceOnboarding.setup.connection.failed.helpCta": "Get help",
    },
  },
};

function renderSheet(props: Partial<ReconnectSheetProps> = {}) {
  const retry = jest.fn();
  const allProps: ReconnectSheetProps = {
    connection: { state: "reconnecting", retry },
    productName: "Ledger Stax",
    suspendSheets: false,
    ...props,
  };
  const view = render(
    <I18nTestProvider resources={COPY}>
      <ReconnectSheet {...allProps} />
    </I18nTestProvider>,
  );
  const rerender = (next: Partial<ReconnectSheetProps>) =>
    view.rerender(
      <I18nTestProvider resources={COPY}>
        <ReconnectSheet {...allProps} {...next} />
      </I18nTestProvider>,
    );

  return { retry, rerender, user: userEvent.setup() };
}

function expanded(testID: string) {
  return screen.getByTestId(testID).props.accessibilityState?.expanded;
}

describe("ReconnectSheet", () => {
  it("should render nothing while the session is up", () => {
    renderSheet({ connection: null });

    expect(screen.queryByTestId(reconnectSheetTestIds.reconnecting)).toBeNull();
    expect(screen.queryByTestId(reconnectSheetTestIds.failed)).toBeNull();
  });

  it("should show the reconnecting sheet with no action", () => {
    renderSheet();

    expect(expanded(reconnectSheetTestIds.reconnecting)).toBe(true);
    expect(screen.getByText("Reconnecting to your Ledger Stax")).toBeTruthy();
    expect(screen.queryByTestId(reconnectSheetTestIds.retry)).toBeNull();
  });

  it("should retry from the failed sheet", async () => {
    const retry = jest.fn();
    const { user } = renderSheet({ connection: { state: "failed", retry } });

    expect(screen.getByText("Couldn't connect to Ledger Stax")).toBeTruthy();
    await user.press(screen.getByTestId(reconnectSheetTestIds.retry));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should open the help article from the failed sheet", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = renderSheet({ connection: { state: "failed", retry: jest.fn() } });

    await user.press(screen.getByTestId(reconnectSheetTestIds.help));

    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("support.ledger.com"));
  });

  it("should stay closed after Close and open again on the next connection state", async () => {
    const { user, rerender, retry } = renderSheet();

    await user.press(screen.getByTestId(`${reconnectSheetTestIds.reconnecting}-header-close`));
    expect(expanded(reconnectSheetTestIds.reconnecting)).toBe(false);

    rerender({ connection: { state: "failed", retry } });
    expect(expanded(reconnectSheetTestIds.failed)).toBe(true);
  });

  it("should hide the sheet while other sheets are suspended", () => {
    renderSheet({ suspendSheets: true });

    expect(expanded(reconnectSheetTestIds.reconnecting)).toBe(false);
  });
});
