import React from "react";
import { act, render } from "@tests/test-renderer";
import DeviceActionModal from "~/components/DeviceActionModal";
import PlatformCompleteExchange from "./CompleteExchange";

jest.mock("~/components/DeviceActionModal", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => jest.fn(() => Promise.resolve()),
}));
jest.mock("~/hooks/deviceActions", () => ({
  useTransactionDeviceAction: () => ({}),
  useCompleteExchangeDeviceAction: () => ({}),
}));

const mockedModal = jest.mocked(DeviceActionModal);

const makeNavigation = (isFocused: boolean) =>
  ({
    isFocused: jest.fn(() => isFocused),
    pop: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const makeRoute = (onClose?: () => void) =>
  ({
    params: {
      request: { exchange: { fromAccount: { type: "Account" } }, provider: "provider" },
      onResult: jest.fn(),
      device: { modelId: "nanoX", deviceId: "id", wired: true },
      onClose,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const getOnClose = (): (() => void) => mockedModal.mock.calls.at(-1)![0].onClose!;

describe("PlatformCompleteExchange", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pops once on a focused close and forwards onClose", () => {
    const navigation = makeNavigation(true);
    const routeOnClose = jest.fn();
    render(<PlatformCompleteExchange navigation={navigation} route={makeRoute(routeOnClose)} />);

    const onClose = getOnClose();
    act(() => onClose());
    act(() => onClose());

    expect(navigation.pop).toHaveBeenCalledTimes(1);
    expect(routeOnClose).toHaveBeenCalledTimes(2);
  });

  it("does not pop when the screen is not focused (closed via redirect)", () => {
    const navigation = makeNavigation(false);
    render(<PlatformCompleteExchange navigation={navigation} route={makeRoute()} />);

    act(() => getOnClose()());

    expect(navigation.pop).not.toHaveBeenCalled();
  });
});
