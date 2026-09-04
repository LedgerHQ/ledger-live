import { track, trackPage } from "~/renderer/analytics/segment";
import {
  HARDWARE_CAROUSEL_PAGE,
  trackHardwareCarouselShown,
  trackHardwareCarouselDeviceClick,
  trackHardwareCarouselCardDismiss,
  trackHardwareCarouselCloseAll,
  type HardwareCarouselSharedAnalyticsProps,
} from "./analytics";

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

const mockSharedProps: HardwareCarouselSharedAnalyticsProps = {
  deviceModel: "lnx",
  personalRecoOptIn: true,
  offerType: "discount",
  platform: "lwd",
};

describe("hardware carousel analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("trackHardwareCarouselShown", () => {
    it("should call trackPage with correct page name and props", () => {
      trackHardwareCarouselShown(mockSharedProps);

      expect(trackPage).toHaveBeenCalledWith(
        HARDWARE_CAROUSEL_PAGE,
        undefined,
        {
          name: HARDWARE_CAROUSEL_PAGE,
          ...mockSharedProps,
        },
        true,
        false,
      );
    });
  });

  describe("trackHardwareCarouselDeviceClick", () => {
    it("should track Gen5 device click", () => {
      trackHardwareCarouselDeviceClick("ledger gen5", mockSharedProps);

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "ledger gen5",
        page: HARDWARE_CAROUSEL_PAGE,
        ...mockSharedProps,
      });
    });

    it("should track Flex device click", () => {
      trackHardwareCarouselDeviceClick("ledger flex", mockSharedProps);

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "ledger flex",
        page: HARDWARE_CAROUSEL_PAGE,
        ...mockSharedProps,
      });
    });

    it("should track Stax device click", () => {
      trackHardwareCarouselDeviceClick("ledger stax", mockSharedProps);

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "ledger stax",
        page: HARDWARE_CAROUSEL_PAGE,
        ...mockSharedProps,
      });
    });
  });

  describe("trackHardwareCarouselCardDismiss", () => {
    it("should track close button click", () => {
      trackHardwareCarouselCardDismiss(mockSharedProps);

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "close",
        page: HARDWARE_CAROUSEL_PAGE,
        ...mockSharedProps,
      });
    });
  });

  describe("trackHardwareCarouselCloseAll", () => {
    it("should track close all button click", () => {
      trackHardwareCarouselCloseAll(mockSharedProps);

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "close all",
        page: HARDWARE_CAROUSEL_PAGE,
        ...mockSharedProps,
      });
    });
  });
});
