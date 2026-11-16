import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nWrapper, SETUP_COPY } from "../../__tests__/i18nWrapper";
import { SetupContent } from "./SetupContent";

const renderContent = (outcome: React.ComponentProps<typeof SetupContent>["outcome"]) => {
  const onDismiss = jest.fn();
  render(<SetupContent outcome={outcome} onDismiss={onDismiss} />, { wrapper: I18nWrapper });
  return { onDismiss };
};

describe("SetupContent (native)", () => {
  it("shows the setup while the trading wallet is being set up", () => {
    renderContent(null);

    expect(screen.getByText(SETUP_COPY.settingUp.title)).toBeOnTheScreen();
  });

  it.each([
    ["created", SETUP_COPY.setUp.created],
    ["found", SETUP_COPY.setUp.found],
  ] as const)("says the account was %s, and continues", (outcome, title) => {
    const { onDismiss } = renderContent({ outcome });

    expect(screen.getByText(title)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(SETUP_COPY.setUp.continue));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("says why the setup failed, and closes", () => {
    const { onDismiss } = renderContent({ outcome: "failed", reason: "failed-deploy" });

    expect(screen.getByText(SETUP_COPY.setupFailed["failed-deploy"])).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Close"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
