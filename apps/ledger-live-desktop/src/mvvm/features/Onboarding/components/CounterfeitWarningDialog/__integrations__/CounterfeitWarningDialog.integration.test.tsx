import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import { urls } from "~/config/urls";
import i18n from "~/renderer/i18n/init";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import CounterfeitWarningDialog from "..";
import { COUNTERFEIT_WARNING_BUTTON, COUNTERFEIT_WARNING_PAGE } from "../analytics";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const renderDialog = (open = true) => {
  const onProceed = jest.fn();
  const onDismiss = jest.fn();

  const view = render(
    <CounterfeitWarningDialog
      open={open}
      deviceModelId={DeviceModelId.nanoX}
      onProceed={onProceed}
      onDismiss={onDismiss}
    />,
  );

  return { ...view, onProceed, onDismiss };
};

describe("CounterfeitWarningDialog Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render when open is true", async () => {
      renderDialog(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-dialog")).toBeVisible();
      });
      expect(screen.getByText(i18n.t("onboarding.counterfeitWarning.title"))).toBeVisible();
      expect(screen.getByText("Ledger.com")).toBeVisible();
      expect(screen.getByText("official reseller network")).toBeVisible();
    });

    it("should not render when open is false", () => {
      renderDialog(false);
      expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
      expect(track).not.toHaveBeenCalledWith("page_viewed", expect.anything());
    });
  });

  describe("user interactions", () => {
    it("should track page_viewed once and handle primary CTA", async () => {
      const { user, onProceed } = renderDialog(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-dialog")).toBeVisible();
      });
      expect(track).toHaveBeenCalledWith("page_viewed", {
        page: COUNTERFEIT_WARNING_PAGE,
        deviceModelId: DeviceModelId.nanoX,
      });

      await user.click(
        screen.getByRole("button", { name: i18n.t("onboarding.counterfeitWarning.cta.primary") }),
      );
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: COUNTERFEIT_WARNING_BUTTON.continueSetup,
        page: COUNTERFEIT_WARNING_PAGE,
        deviceModelId: DeviceModelId.nanoX,
      });
      expect(onProceed).toHaveBeenCalledTimes(1);
    });

    it("should open learn more URL and track learn more on secondary CTA", async () => {
      const { user } = renderDialog(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-dialog")).toBeVisible();
      });

      await user.click(
        screen.getByRole("button", { name: i18n.t("onboarding.counterfeitWarning.cta.secondary") }),
      );
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: COUNTERFEIT_WARNING_BUTTON.learnMore,
        page: COUNTERFEIT_WARNING_PAGE,
        deviceModelId: DeviceModelId.nanoX,
      });
      expect(openURL).toHaveBeenCalledWith(urls.genuineCheck);
    });

    it("should track close and call onDismiss when closed", async () => {
      const { user, onDismiss } = renderDialog(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-dialog")).toBeVisible();
      });

      await user.keyboard("{Escape}");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: COUNTERFEIT_WARNING_BUTTON.close,
        page: COUNTERFEIT_WARNING_PAGE,
        deviceModelId: DeviceModelId.nanoX,
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
