import { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  DeviceActionAnimationSource,
  DeviceActionContentAction,
  SupportedDeviceActionModelId,
} from "./types";
import {
  getDeviceActionAnimation,
  getDeviceActionAnimationStyle,
  supportedDeviceActionModelIds,
} from "./getDeviceActionAnimation";

import NanoSPPinDark from "~/animations/device/nanoSP/dark/pin.json";
import NanoSPPinLight from "~/animations/device/nanoSP/light/pin.json";
import NanoSPContinueDark from "~/animations/device/nanoSP/dark/continue.json";
import NanoSPContinueLight from "~/animations/device/nanoSP/light/continue.json";

import NanoXPinDark from "~/animations/device/nanoX/dark/pin.json";
import NanoXPinLight from "~/animations/device/nanoX/light/pin.json";
import NanoXContinueDark from "~/animations/device/nanoX/dark/continue.json";
import NanoXContinueLight from "~/animations/device/nanoX/light/continue.json";

import StaxPinDark from "~/animations/device/stax/dark/pin.json";
import StaxPinLight from "~/animations/device/stax/light/pin.json";
import StaxContinueDark from "~/animations/device/stax/dark/continue.json";
import StaxContinueLight from "~/animations/device/stax/light/continue.json";

import FlexPinDark from "~/animations/device/flex/dark/pin.json";
import FlexPinLight from "~/animations/device/flex/light/pin.json";
import FlexContinueDark from "~/animations/device/flex/dark/continue.json";
import FlexContinueLight from "~/animations/device/flex/light/continue.json";

import ApexPinDark from "~/animations/device/apex/dark/pin.json";
import ApexPinLight from "~/animations/device/apex/light/pin.json";
import ApexContinueDark from "~/animations/device/apex/dark/continue.json";
import ApexContinueLight from "~/animations/device/apex/light/continue.json";

type ExpectedAnimations = Record<
  DeviceActionContentAction,
  Record<"light" | "dark", DeviceActionAnimationSource>
>;

const expectedAnimations: Record<SupportedDeviceActionModelId, ExpectedAnimations> = {
  [DeviceModelId.nanoS]: {
    continue: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    "power-and-unlock": {
      light: NanoSPPinLight,
      dark: NanoSPPinDark,
    },
  },
  [DeviceModelId.nanoSP]: {
    continue: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    "power-and-unlock": {
      light: NanoSPPinLight,
      dark: NanoSPPinDark,
    },
  },
  [DeviceModelId.nanoX]: {
    continue: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    "power-and-unlock": {
      light: NanoXPinLight,
      dark: NanoXPinDark,
    },
  },
  [DeviceModelId.stax]: {
    continue: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    "power-and-unlock": {
      light: StaxPinLight,
      dark: StaxPinDark,
    },
  },
  [DeviceModelId.europa]: {
    continue: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    "power-and-unlock": {
      light: FlexPinLight,
      dark: FlexPinDark,
    },
  },
  [DeviceModelId.apex]: {
    continue: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    "power-and-unlock": {
      light: ApexPinLight,
      dark: ApexPinDark,
    },
  },
};

describe("getDeviceActionAnimation", () => {
  it("supports every DeviceModelId except blue", () => {
    expect(supportedDeviceActionModelIds).toEqual(
      Object.values(DeviceModelId).filter(modelId => modelId !== DeviceModelId.blue),
    );
    expect(supportedDeviceActionModelIds).not.toContain(DeviceModelId.blue);
  });

  it("maps nanoS to Nano S Plus animations", () => {
    expect(
      getDeviceActionAnimation({
        modelId: DeviceModelId.nanoS,
        action: "continue",
        theme: "dark",
      }),
    ).toBe(NanoSPContinueDark);
    expect(
      getDeviceActionAnimation({
        modelId: DeviceModelId.nanoS,
        action: "power-and-unlock",
        theme: "light",
      }),
    ).toBe(NanoSPPinLight);
  });

  it.each([
    DeviceModelId.nanoSP,
    DeviceModelId.nanoX,
    DeviceModelId.stax,
    DeviceModelId.europa,
    DeviceModelId.apex,
  ] as const)("returns expected continue and pin animations for %s", modelId => {
    expect(
      getDeviceActionAnimation({
        modelId,
        action: "continue",
        theme: "light",
      }),
    ).toBe(expectedAnimations[modelId].continue.light);
    expect(
      getDeviceActionAnimation({
        modelId,
        action: "continue",
        theme: "dark",
      }),
    ).toBe(expectedAnimations[modelId].continue.dark);
    expect(
      getDeviceActionAnimation({
        modelId,
        action: "power-and-unlock",
        theme: "light",
      }),
    ).toBe(expectedAnimations[modelId]["power-and-unlock"].light);
    expect(
      getDeviceActionAnimation({
        modelId,
        action: "power-and-unlock",
        theme: "dark",
      }),
    ).toBe(expectedAnimations[modelId]["power-and-unlock"].dark);
  });

  it("returns undefined for blue", () => {
    expect(
      getDeviceActionAnimation({
        modelId: DeviceModelId.blue,
        action: "continue",
        theme: "light",
      }),
    ).toBeUndefined();
  });
});

describe("getDeviceActionAnimationStyle", () => {
  it.each(supportedDeviceActionModelIds)("returns 200x200 for %s", modelId => {
    expect(getDeviceActionAnimationStyle(modelId)).toEqual({
      height: 200,
      width: 200,
    });
  });

  it("returns an empty style for blue", () => {
    expect(getDeviceActionAnimationStyle(DeviceModelId.blue)).toEqual({});
  });
});
