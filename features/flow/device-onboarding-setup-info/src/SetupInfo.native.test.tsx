import React from "react";
import { Linking } from "react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { render, screen, userEvent } from "@testing-library/react-native";
import { SetupInfo } from "./SetupInfo";
import type { SetupInfoProps } from "./SetupInfo.types";
import { setupInfoTestIds } from "./internals";

const COPY = {
  en: {
    translation: {
      "deviceOnboarding.setup.info.cards.setupChoice": "Which setup method?",
      "deviceOnboarding.setup.info.cards.recoveryPhrase": "What’s a Secret Recovery Phrase?",
      "deviceOnboarding.setup.info.cards.restoreRecoveryKey": "What’s a Secret Recovery Key?",
      "deviceOnboarding.setup.info.faq": "View complete FAQ",
      "deviceOnboarding.setup.info.setupChoice.newDevice.title": "Set up as a new Ledger device",
      "deviceOnboarding.setup.info.recoveryKey.learnHowToUse": "Learn how to use",
    },
  },
};

function renderSetupInfo(props: Partial<SetupInfoProps> = {}) {
  const allProps: SetupInfoProps = { card: "setupChoice", suspendSheets: false, ...props };
  const view = render(
    <I18nTestProvider resources={COPY}>
      <SetupInfo {...allProps} />
    </I18nTestProvider>,
  );
  const rerender = (next: Partial<SetupInfoProps>) =>
    view.rerender(
      <I18nTestProvider resources={COPY}>
        <SetupInfo {...allProps} {...next} />
      </I18nTestProvider>,
    );

  return { rerender, user: userEvent.setup() };
}

function sheet() {
  return screen.getByTestId(setupInfoTestIds.sheet);
}

describe("SetupInfo", () => {
  it("should render nothing without a card", () => {
    renderSetupInfo({ card: undefined });

    expect(screen.queryByTestId(setupInfoTestIds.card)).toBeNull();
    expect(screen.queryByTestId(setupInfoTestIds.sheet)).toBeNull();
  });

  it("should open the stage's sheet from its card", async () => {
    const { user } = renderSetupInfo();

    expect(screen.getByText("Which setup method?")).toBeTruthy();
    expect(sheet()).toHaveProp("accessibilityState", { expanded: false });

    await user.press(screen.getByTestId(setupInfoTestIds.card));

    expect(sheet()).toHaveProp("accessibilityState", { expanded: true });
    expect(screen.getByText("Set up as a new Ledger device")).toBeTruthy();
  });

  it("should open the Recovery Key sheet from the restore card", async () => {
    const { user } = renderSetupInfo({ card: "restoreRecoveryKey" });

    await user.press(screen.getByText("What’s a Secret Recovery Key?"));

    expect(sheet()).toHaveProp("accessibilityState", { expanded: true });
    expect(screen.getByText("Learn how to use")).toBeTruthy();
  });

  it("should hide an open sheet while sheets are suspended and bring it back after", async () => {
    const { user, rerender } = renderSetupInfo();

    await user.press(screen.getByTestId(setupInfoTestIds.card));
    expect(sheet()).toHaveProp("accessibilityState", { expanded: true });

    rerender({ suspendSheets: true });
    expect(sheet()).toHaveProp("accessibilityState", { expanded: false });

    rerender({ suspendSheets: false });
    expect(sheet()).toHaveProp("accessibilityState", { expanded: true });
  });

  it("should close the sheet when the stage changes", async () => {
    const { user, rerender } = renderSetupInfo();

    await user.press(screen.getByTestId(setupInfoTestIds.card));
    rerender({ card: "recoveryPhrase" });

    expect(sheet()).toHaveProp("accessibilityState", { expanded: false });
  });

  it("should open the recovery phrase article from its sheet", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = renderSetupInfo({ card: "recoveryPhrase" });

    await user.press(screen.getByTestId(setupInfoTestIds.card));
    await user.press(screen.getByTestId(setupInfoTestIds.sheetLink));

    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("what-is-a-recovery-phrase"));
  });
});
