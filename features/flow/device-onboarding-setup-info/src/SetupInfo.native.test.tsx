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
      "deviceOnboarding.setup.info.setupChoice.restore.description":
        "Restore: phrase, Recovery Key, or Recover.",
      "deviceOnboarding.setup.info.setupChoice.restore.descriptionWithoutRecoveryKey":
        "Restore: phrase or Recover.",
      "deviceOnboarding.setup.info.recoveryKey.learnHowToUse": "Learn how to use",
      "deviceOnboarding.setup.info.cards.restoreChoice": "Choose a backup to restore from",
      "deviceOnboarding.setup.info.restoreChoice.recoveryPhrase.title": "Secret Recovery Phrase",
      "deviceOnboarding.setup.info.restoreChoice.recoveryKey.title": "Ledger Recovery Key",
      "deviceOnboarding.setup.info.restoreChoice.recover.title": "Ledger Recover subscription",
    },
  },
};

function renderSetupInfo(props: Partial<SetupInfoProps> = {}) {
  const allProps: SetupInfoProps = {
    card: "setupChoice",
    suspendSheets: false,
    reportsRecoveryKey: true,
    ...props,
  };
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

  it("should list the Recovery Key among the backups when the device supports one", async () => {
    const { user } = renderSetupInfo({ card: "restoreChoice" });

    await user.press(screen.getByTestId(setupInfoTestIds.card));

    expect(screen.getByText("Secret Recovery Phrase")).toBeTruthy();
    expect(screen.getByText("Ledger Recovery Key")).toBeTruthy();
    expect(screen.getByText("Ledger Recover subscription")).toBeTruthy();
  });

  it("should leave the Recovery Key out of the backups when the device has no Recovery Key", async () => {
    const { user } = renderSetupInfo({ card: "restoreChoice", reportsRecoveryKey: false });

    await user.press(screen.getByTestId(setupInfoTestIds.card));

    expect(screen.getByText("Secret Recovery Phrase")).toBeTruthy();
    expect(screen.queryByText("Ledger Recovery Key")).toBeNull();
    expect(screen.getByText("Ledger Recover subscription")).toBeTruthy();
  });

  it("should mention the Recovery Key among restore options when the device supports one", async () => {
    const { user } = renderSetupInfo();

    await user.press(screen.getByTestId(setupInfoTestIds.card));

    expect(screen.getByText("Restore: phrase, Recovery Key, or Recover.")).toBeTruthy();
  });

  it("should leave the Recovery Key out of the restore options when the device has no Recovery Key", async () => {
    const { user } = renderSetupInfo({ reportsRecoveryKey: false });

    await user.press(screen.getByTestId(setupInfoTestIds.card));

    expect(screen.getByText("Restore: phrase or Recover.")).toBeTruthy();
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
