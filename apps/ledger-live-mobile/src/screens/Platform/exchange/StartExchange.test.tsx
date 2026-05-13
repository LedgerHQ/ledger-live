import React from "react";
import { act, render } from "@tests/test-renderer";
import DeviceActionModal from "~/components/DeviceActionModal";
import PlatformStartExchange from "./StartExchange";

jest.mock("~/components/SelectDevice2", () => ({ __esModule: true, default: () => null }));
jest.mock("~/components/DeviceActionModal", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
jest.mock("~/hooks/deviceActions", () => ({
  useStartExchangeDeviceAction: () => ({}),
}));

const mockedModal = jest.mocked(DeviceActionModal);

const makeNavigation = (isFocused: boolean) =>
  ({
    isFocused: jest.fn(() => isFocused),
    pop: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const route = { params: { request: {}, onResult: jest.fn() } } as any;

const getOnClose = (): (() => void) => mockedModal.mock.calls.at(-1)![0].onClose!;

describe("PlatformStartExchange", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pops once on a focused close and ignores subsequent closes", () => {
    const navigation = makeNavigation(true);
    render(<PlatformStartExchange navigation={navigation} route={route} />);

    const onClose = getOnClose();
    act(() => onClose());
    act(() => onClose());

    expect(navigation.pop).toHaveBeenCalledTimes(1);
  });

  it("does not pop when the screen is not focused (closed via redirect)", () => {
    const navigation = makeNavigation(false);
    render(<PlatformStartExchange navigation={navigation} route={route} />);

    act(() => getOnClose()());

    expect(navigation.pop).not.toHaveBeenCalled();
  });
});
