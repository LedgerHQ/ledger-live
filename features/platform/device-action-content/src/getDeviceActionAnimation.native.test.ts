import { getDeviceActionAnimation } from "./getDeviceActionAnimation.native";

import NanoSPPinDark from "./animations/native/nanoSP/dark/pin.json";
import NanoSPPinLight from "./animations/native/nanoSP/light/pin.json";
import NanoSPContinueDark from "./animations/native/nanoSP/dark/continue.json";
import NanoSPContinueLight from "./animations/native/nanoSP/light/continue.json";

import NanoXPinDark from "./animations/native/nanoX/dark/pin.json";
import NanoXPinLight from "./animations/native/nanoX/light/pin.json";
import NanoXContinueDark from "./animations/native/nanoX/dark/continue.json";
import NanoXContinueLight from "./animations/native/nanoX/light/continue.json";

import StaxPinDark from "./animations/native/stax/dark/pin.json";
import StaxPinLight from "./animations/native/stax/light/pin.json";
import StaxContinueDark from "./animations/native/stax/dark/continue.json";
import StaxContinueLight from "./animations/native/stax/light/continue.json";

import FlexPinDark from "./animations/native/flex/dark/pin.json";
import FlexPinLight from "./animations/native/flex/light/pin.json";
import FlexContinueDark from "./animations/native/flex/dark/continue.json";
import FlexContinueLight from "./animations/native/flex/light/continue.json";

import ApexPinDark from "./animations/native/apex/dark/pin.json";
import ApexPinLight from "./animations/native/apex/light/pin.json";
import ApexContinueDark from "./animations/native/apex/dark/continue.json";
import ApexContinueLight from "./animations/native/apex/light/continue.json";

const expectedAnimations = {
  nanoSP: {
    continue: { light: NanoSPContinueLight, dark: NanoSPContinueDark },
    "power-and-unlock": { light: NanoSPPinLight, dark: NanoSPPinDark },
  },
  nanoX: {
    continue: { light: NanoXContinueLight, dark: NanoXContinueDark },
    "power-and-unlock": { light: NanoXPinLight, dark: NanoXPinDark },
  },
  stax: {
    continue: { light: StaxContinueLight, dark: StaxContinueDark },
    "power-and-unlock": { light: StaxPinLight, dark: StaxPinDark },
  },
  europa: {
    continue: { light: FlexContinueLight, dark: FlexContinueDark },
    "power-and-unlock": { light: FlexPinLight, dark: FlexPinDark },
  },
  apex: {
    continue: { light: ApexContinueLight, dark: ApexContinueDark },
    "power-and-unlock": { light: ApexPinLight, dark: ApexPinDark },
  },
} as const;

describe("getDeviceActionAnimation (native)", () => {
  it("maps nanoS to Nano S Plus animations", () => {
    expect(getDeviceActionAnimation({ modelId: "nanoS", action: "continue", theme: "dark" })).toBe(
      NanoSPContinueDark,
    );
    expect(
      getDeviceActionAnimation({ modelId: "nanoS", action: "power-and-unlock", theme: "light" }),
    ).toBe(NanoSPPinLight);
  });

  it.each(["nanoSP", "nanoX", "stax", "europa", "apex"] as const)(
    "returns expected continue and power-and-unlock animations for %s",
    modelId => {
      expect(getDeviceActionAnimation({ modelId, action: "continue", theme: "light" })).toBe(
        expectedAnimations[modelId].continue.light,
      );
      expect(getDeviceActionAnimation({ modelId, action: "continue", theme: "dark" })).toBe(
        expectedAnimations[modelId].continue.dark,
      );
      expect(
        getDeviceActionAnimation({ modelId, action: "power-and-unlock", theme: "light" }),
      ).toBe(expectedAnimations[modelId]["power-and-unlock"].light);
      expect(getDeviceActionAnimation({ modelId, action: "power-and-unlock", theme: "dark" })).toBe(
        expectedAnimations[modelId]["power-and-unlock"].dark,
      );
    },
  );
});
