import React from "react";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, waitFor } from "@tests/test-renderer";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import CounterfeitWarningDrawer from "..";
import { COUNTERFEIT_WARNING_BUTTON, COUNTERFEIT_WARNING_PAGE } from "../analytics";

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

    it("should not track page_viewed when isOpen is false", () => {
      renderDrawer(false);
      expect(track).not.toHaveBeenCalledWith("page_viewed", expect.anything());
    });
  });

  describe("user interactions", () => {
    it("should track page_viewed once and handle primary CTA", async () => {
      const { user, onProceed } = renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByText("Continue setup")).toBeVisible();
      });
      expect(track).toHaveBeenCalledWith("page_viewed", { page: COUNTERFEIT_WARNING_PAGE });

      await user.press(screen.getByText("Continue setup"));
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: COUNTERFEIT_WARNING_BUTTON.continueSetup,
        page: COUNTERFEIT_WARNING_PAGE,
      });
      expect(onProceed).toHaveBeenCalledTimes(1);
    });

    it("should open the genuine check URL and track learn more on secondary CTA", async () => {
      const { user } = renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByText("Learn more")).toBeVisible();
      });

      await user.press(screen.getByText("Learn more"));
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: COUNTERFEIT_WARNING_BUTTON.learnMore,
        page: COUNTERFEIT_WARNING_PAGE,
      });
      expect(openURLSpy).toHaveBeenCalledWith(urls.genuineCheck.learnMore);
    });
  });
});
