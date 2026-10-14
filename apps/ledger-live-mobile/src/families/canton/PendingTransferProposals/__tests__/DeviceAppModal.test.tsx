/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TransferOfferExpiredError } from "@ledgerhq/coin-canton";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import { View } from "../DeviceAppModal";
import type { DeviceAppModalViewModel } from "../useDeviceAppModalViewModel";

const buildProps = (overrides?: Partial<DeviceAppModalViewModel>) => ({
  isOpen: true,
  action: "accept" as const,
  onClose: jest.fn(),
  confirmationState: "error" as const,
  error: null,
  request: { appName: "Canton" },
  device: null,
  actionConnect: {} as DeviceAppModalViewModel["actionConnect"],
  handleDeviceResult: jest.fn(),
  handleRetry: jest.fn(),
  ...overrides,
});

describe("DeviceAppModal View", () => {
  describe("error state", () => {
    it("should offer retry for a generic error", () => {
      render(<View {...buildProps({ error: new Error("Test failure") })} />);

      expect(screen.getByText("Retry")).toBeTruthy();
    });

    it("should show the expired message with close and no retry when the offer has expired", () => {
      const onClose = jest.fn();
      render(
        <View {...buildProps({ error: new TransferOfferExpiredError() })} onClose={onClose} />,
      );

      expect(screen.getByText("This offer has expired")).toBeTruthy();
      expect(screen.queryByText("Retry")).toBeNull();

      fireEvent.press(screen.getByText("Close"));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
