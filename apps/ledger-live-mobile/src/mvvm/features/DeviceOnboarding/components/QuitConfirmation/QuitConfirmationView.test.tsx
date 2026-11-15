import React from "react";
import { render, screen } from "@tests/test-renderer";
import { quitConfirmationTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { QuitConfirmation } from "./index";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const RN = jest.requireActual("react-native");

  return {
    ...actual,
    BottomSheetHeader: ({ title, description }: { title?: string; description?: string }) => (
      <>
        {title ? <RN.Text>{title}</RN.Text> : null}
        {description ? <RN.Text>{description}</RN.Text> : null}
      </>
    ),
    BottomSheetView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
  };
});

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: jest.requireActual("@shared/ui-queued-bottom-sheet/testing/module-mock")
    .QueuedBottomSheet,
}));

describe("QuitConfirmation", () => {
  it("should continue setup without leaving", async () => {
    const onContinue = jest.fn();
    const onLeave = jest.fn();
    const { user } = render(
      <QuitConfirmation isOpen stepName="Introduction" onContinue={onContinue} onLeave={onLeave} />,
    );

    expect(screen.getByText("Pause setup for now?")).toBeVisible();
    expect(
      screen.getByText(
        "Any unsaved progress on this step will be lost.\nYou'll need to restart from Introduction next time.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Leave without saving")).toBeVisible();
    expect(screen.getByText("Continue setup")).toBeVisible();

    await user.press(screen.getByTestId(quitConfirmationTestIds.continue));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("should leave without saving", async () => {
    const onContinue = jest.fn();
    const onLeave = jest.fn();
    const { user } = render(
      <QuitConfirmation isOpen stepName="Introduction" onContinue={onContinue} onLeave={onLeave} />,
    );

    await user.press(screen.getByTestId(quitConfirmationTestIds.leave));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("should keep going when the sheet is dismissed", async () => {
    const onContinue = jest.fn();
    const { user } = render(
      <QuitConfirmation
        isOpen
        stepName="Introduction"
        onContinue={onContinue}
        onLeave={jest.fn()}
      />,
    );

    await user.press(screen.getByTestId(`${quitConfirmationTestIds.sheet}-dismiss`));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
