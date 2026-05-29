import React from "react";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, waitFor } from "@tests/test-renderer";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import CounterfeitWarningDrawer from "..";
import { EVENT_CONCERN, EVENT_PROCEED, EVENT_SHOWN } from "../analytics";

const analyticsPayload = { deviceModelId: DeviceModelId.nanoX, flow: "Onboarding" };

const renderDrawer = (isOpen = true) => {
  const onProceed = jest.fn();
  const onDismiss = jest.fn();

  const view = render(
    <CounterfeitWarningDrawer
      isOpen={isOpen}
      deviceModelId={DeviceModelId.nanoX}
      onProceed={onProceed}
      onDismiss={onDismiss}
    />,
  );

  return { ...view, onProceed, onDismiss };
};

describe("CounterfeitWarningDrawer Integration", () => {
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    openURLSpy = jest.spyOn(Linking, "openURL").mockImplementation(async () => undefined);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  describe("rendering", () => {
    it("should render when isOpen is true", async () => {
      renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByText("Before you start")).toBeVisible();
      });
    });

    it("should not track shown when isOpen is false", () => {
      renderDrawer(false);
      expect(track).not.toHaveBeenCalledWith(EVENT_SHOWN, expect.anything());
    });
  });

  describe("user interactions", () => {
    it("should track shown once and handle primary CTA", async () => {
      const { user, onProceed } = renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByText("Continue setup")).toBeVisible();
      });
      expect(track).toHaveBeenCalledWith(EVENT_SHOWN, analyticsPayload);

      await user.press(screen.getByText("Continue setup"));
      expect(track).toHaveBeenCalledWith(EVENT_PROCEED, analyticsPayload);
      expect(onProceed).toHaveBeenCalledTimes(1);
    });

    it("should open the genuine check URL and track concern on secondary CTA", async () => {
      const { user } = renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByText("Learn more")).toBeVisible();
      });

      await user.press(screen.getByText("Learn more"));
      expect(track).toHaveBeenCalledWith(EVENT_CONCERN, analyticsPayload);
      expect(openURLSpy).toHaveBeenCalledWith(urls.genuineCheck.learnMore);
    });
  });
});
