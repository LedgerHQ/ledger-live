import { getDeviceActionAnimation } from "./getDeviceActionAnimation.web";

import NanoSPPinDark from "./animations/web/nanoSP/dark/pin.json";
import NanoSPPinLight from "./animations/web/nanoSP/light/pin.json";
import NanoSPContinueDark from "./animations/web/nanoSP/dark/continue.json";
import NanoSPContinueLight from "./animations/web/nanoSP/light/continue.json";

import NanoXPinDark from "./animations/web/nanoX/dark/pin.json";
import NanoXPinLight from "./animations/web/nanoX/light/pin.json";
import NanoXContinueDark from "./animations/web/nanoX/dark/continue.json";
import NanoXContinueLight from "./animations/web/nanoX/light/continue.json";

import StaxPinDark from "./animations/web/stax/dark/pin.json";
import StaxPinLight from "./animations/web/stax/light/pin.json";
import StaxContinueDark from "./animations/web/stax/dark/continue.json";
import StaxContinueLight from "./animations/web/stax/light/continue.json";

import FlexPinDark from "./animations/web/flex/dark/pin.json";
import FlexPinLight from "./animations/web/flex/light/pin.json";
import FlexContinueDark from "./animations/web/flex/dark/continue.json";
import FlexContinueLight from "./animations/web/flex/light/continue.json";

import ApexPinDark from "./animations/web/apex/dark/pin.json";
import ApexPinLight from "./animations/web/apex/light/pin.json";
import ApexContinueDark from "./animations/web/apex/dark/continue.json";
import ApexContinueLight from "./animations/web/apex/light/continue.json";

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

describe("getDeviceActionAnimation (web)", () => {
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
