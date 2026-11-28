import React from "react";
import { track } from "@shared/analytics";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { karaokeTestIds } from "@shared/ui-karaoke/native";
import { unseededIntroKaraokeTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { UnseededIntroKaraokeScreen } from "./index";

const introPhrases = [
  "You’re about to take control.",
  "Your keys stay with you.",
  "Nothing moves without your say.",
  "Let’s set it up.",
];

function renderIntro({
  deviceModelId = DeviceModelId.stax,
  warningEnabled = false,
}: { deviceModelId?: DeviceModelId; warningEnabled?: boolean } = {}) {
  const onFinish = jest.fn(() => true);
  const onClose = jest.fn();
  const view = render(
    <UnseededIntroKaraokeScreen
      deviceModelId={deviceModelId}
      onFinish={onFinish}
      onClose={onClose}
    />,
    {
      overrideInitialState: withFlagOverrides({
        lwmOnboardingCounterfeitWarning: { enabled: warningEnabled },
      }),
    },
  );
  return { ...view, onFinish, onClose };
}

async function tapToLastPhrase(user: ReturnType<typeof renderIntro>["user"]) {
  for (const phrase of introPhrases.slice(1)) {
    await user.press(screen.getByTestId(karaokeTestIds.advance));
    expect(screen.getByText(phrase)).toBeOnTheScreen();
  }
}

describe("UnseededIntroKaraokeScreen", () => {
  it("should show the 4 intro phrases one by one, then the action", async () => {
    const { user, onFinish } = renderIntro();

    expect(screen.getByText(introPhrases[0])).toBeOnTheScreen();
    expect(screen.queryByText(introPhrases[1])).toBeNull();
    expect(screen.getByText("Tap to continue")).toBeVisible();

    for (const phrase of introPhrases.slice(1)) {
      await user.press(screen.getByTestId(karaokeTestIds.advance));
      expect(screen.getByText(phrase)).toBeOnTheScreen();
    }

    expect(screen.queryByText("Tap to continue")).toBeNull();
    expect(onFinish).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Check your device" }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("should not show the action before the last phrase", async () => {
    const { user } = renderIntro();

    await user.press(screen.getByTestId(karaokeTestIds.advance));

    expect(screen.queryByTestId(unseededIntroKaraokeTestIds.action)).toBeNull();
  });

  it("should close without finishing", async () => {
    const { user, onClose, onFinish } = renderIntro();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
  });

  describe("counterfeit warning", () => {
    it("should open the drawer instead of finishing on a Nano with the flag on", async () => {
      const { user, onFinish } = renderIntro({
        deviceModelId: DeviceModelId.nanoX,
        warningEnabled: true,
      });

      await tapToLastPhrase(user);
      await user.press(screen.getByRole("button", { name: "Check your device" }));

      expect(await screen.findByText("Before you start")).toBeVisible();
      expect(onFinish).not.toHaveBeenCalled();

      await user.press(screen.getByRole("button", { name: "Continue setup" }));

      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("should finish right away on a Stax even with the flag on", async () => {
      const { user, onFinish } = renderIntro({
        deviceModelId: DeviceModelId.stax,
        warningEnabled: true,
      });

      await tapToLastPhrase(user);
      await user.press(screen.getByRole("button", { name: "Check your device" }));

      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Before you start")).toBeNull();
    });

    it("should finish right away on a Nano with the flag off", async () => {
      const { user, onFinish } = renderIntro({ deviceModelId: DeviceModelId.nanoX });

      await tapToLastPhrase(user);
      await user.press(screen.getByRole("button", { name: "Check your device" }));

      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("should not report a close click when another sheet hides the warning", async () => {
      const { user, onFinish, rerender } = renderIntro({
        deviceModelId: DeviceModelId.nanoX,
        warningEnabled: true,
      });
      await tapToLastPhrase(user);
      await user.press(screen.getByRole("button", { name: "Check your device" }));
      expect(await screen.findByText("Before you start")).toBeVisible();
      jest.mocked(track).mockClear();

      rerender(
        <UnseededIntroKaraokeScreen
          deviceModelId={DeviceModelId.nanoX}
          suspendSheets
          onFinish={onFinish}
          onClose={jest.fn()}
        />,
      );

      expect(track).not.toHaveBeenCalledWith("button_clicked", expect.anything());
      expect(onFinish).not.toHaveBeenCalled();
    });
  });
});
