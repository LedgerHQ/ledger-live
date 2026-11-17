import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, SETUP_COPY } from "../../__tests__/i18nWrapper";
import { SetupContent } from "./SetupContent";

const renderContent = (outcome: React.ComponentProps<typeof SetupContent>["outcome"]) => {
  const onDismiss = jest.fn();
  render(<SetupContent outcome={outcome} onDismiss={onDismiss} />, { wrapper: I18nWrapper });
  return { onDismiss };
};

describe("SetupContent (web)", () => {
  it("shows the setup while the trading wallet is being set up", () => {
    renderContent(null);

    expect(screen.getByText(SETUP_COPY.settingUp.title)).toBeVisible();
  });

  it.each([
    ["created", SETUP_COPY.setUp.created],
    ["found", SETUP_COPY.setUp.found],
  ] as const)("says the account was %s, and continues", async (outcome, title) => {
    const { onDismiss } = renderContent({ outcome });

    expect(screen.getByText(title)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: SETUP_COPY.setUp.continue }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("says why the setup failed, and closes", async () => {
    const { onDismiss } = renderContent({ outcome: "failed", reason: "unavailable" });

    expect(screen.getByText(SETUP_COPY.setupFailed.title)).toBeVisible();
    expect(screen.getByText(SETUP_COPY.setupFailed.unavailable)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
