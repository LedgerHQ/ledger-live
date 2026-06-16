import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ThorSwapIncompatibility,
  SWAP_NANO_S_INCOMPATIBILITY_PAGE,
} from "./ThorSwapIncompatibility";

const mockTrack = jest.fn();
const mockTrackScreen = jest.fn();

jest.mock("~/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  TrackScreen: (props: Record<string, unknown>) => {
    mockTrackScreen(props);
    return null;
  },
}));

const nanoS: Device = {
  modelId: DeviceModelId.nanoS,
  deviceId: "nanoS",
  wired: true,
};

const t = (key: string) => key;

const EXPLORE_KEY = "transfer.swap2.wrongDevice.explore_compatible_devices";
const SWAP_PROVIDER_KEY = "transfer.swap2.wrongDevice.swapWithAnotherProvider";

const expectedProperties = {
  flow: "swap",
  deviceModel: "nanoS",
  variant: "provider",
  provider: "thorswap",
  sourceCurrency: "bitcoin",
  targetCurrency: "ethereum",
};

const setup = (onClose = jest.fn()) => {
  const utils = render(
    <ThorSwapIncompatibility
      t={t}
      device={nanoS}
      provider="thorswap"
      theme="light"
      onClose={onClose}
      sourceCurrency="bitcoin"
      targetCurrency="ethereum"
    />,
  );
  return { ...utils, onClose };
};

describe("ThorSwapIncompatibility - analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  it("tracks the page view on render", () => {
    setup();

    expect(mockTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: SWAP_NANO_S_INCOMPATIBILITY_PAGE,
        ...expectedProperties,
      }),
    );
  });

  it("tracks the explore compatible devices CTA", async () => {
    const { user } = setup();

    await user.press(screen.getByText(EXPLORE_KEY));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "explore_compatible_devices",
      page: SWAP_NANO_S_INCOMPATIBILITY_PAGE,
      ...expectedProperties,
    });
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
  });

  it("tracks the swap with another provider CTA and closes", async () => {
    const { user, onClose } = setup();

    await user.press(screen.getByText(SWAP_PROVIDER_KEY));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "swap_with_another_provider",
      page: SWAP_NANO_S_INCOMPATIBILITY_PAGE,
      ...expectedProperties,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
