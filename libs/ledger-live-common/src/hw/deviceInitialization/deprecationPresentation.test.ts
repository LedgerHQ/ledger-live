import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceDeprecationRules } from "../connectApp";
import { FlowName } from "../../device-action/utils";
import { decideDeprecationPresentation } from "./deprecationPresentation";

const defaultDate = new Date("2023-12-31");

function createRules(overrides: Partial<DeviceDeprecationRules> = {}): DeviceDeprecationRules {
  return {
    warningScreenVisible: false,
    clearSigningScreenVisible: false,
    errorScreenVisible: false,
    modelId: DeviceModelId.nanoS,
    date: defaultDate,
    warningScreenRules: { exception: [], deprecatedFlow: [] },
    clearSigningScreenRules: { exception: [], deprecatedFlow: [] },
    errorScreenRules: { exception: [], deprecatedFlow: [] },
    onContinue: jest.fn(),
    ...overrides,
  };
}

// These tests define the deprecation semantics expected by the shared DIE
// initializer: dismissing a currency only skips the generic warning screen,
// while clear-signing remains an independent gate.
describe("deviceInitialization deprecationPresentation", () => {
  it("returns block when the blocking screen applies", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          errorScreenVisible: true,
          errorScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
        }),
        flow: FlowName.send,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: ["Ethereum"],
      }),
    ).toEqual({
      status: "block",
      currencyName: "Ethereum",
      deviceModelId: DeviceModelId.nanoS,
      supportEndDate: defaultDate,
    });
  });

  it("returns warning and clear-signing screens when both apply", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          warningScreenVisible: true,
          clearSigningScreenVisible: true,
          warningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
          clearSigningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
        }),
        flow: FlowName.send,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: [],
      }),
    ).toEqual({
      status: "show",
      screenSequence: ["warning", "clearSigning"],
      currencyName: "Ethereum",
      deviceModelId: DeviceModelId.nanoS,
      supportEndDate: defaultDate,
    });
  });

  it("returns only the warning screen when clear-signing does not apply", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          warningScreenVisible: true,
          clearSigningScreenVisible: true,
          warningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
          clearSigningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.receive],
          },
        }),
        flow: FlowName.send,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: [],
      }),
    ).toEqual({
      status: "show",
      screenSequence: ["warning"],
      currencyName: "Ethereum",
      deviceModelId: DeviceModelId.nanoS,
      supportEndDate: defaultDate,
    });
  });

  it("returns the clear-signing screen on its own when only it applies", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          clearSigningScreenVisible: true,
          clearSigningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.receive],
          },
        }),
        flow: FlowName.receive,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: [],
      }),
    ).toEqual({
      status: "show",
      screenSequence: ["clearSigning"],
      currencyName: "Ethereum",
      deviceModelId: DeviceModelId.nanoS,
      supportEndDate: defaultDate,
    });
  });

  it("skips the warning but still shows clear-signing when the currency was dismissed", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          warningScreenVisible: true,
          clearSigningScreenVisible: true,
          warningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
          clearSigningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
        }),
        flow: FlowName.send,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: ["Ethereum"],
      }),
    ).toEqual({
      status: "show",
      screenSequence: ["clearSigning"],
      currencyName: "Ethereum",
      deviceModelId: DeviceModelId.nanoS,
      supportEndDate: defaultDate,
    });
  });

  it("skips the warning when it was dismissed and no clear-signing screen applies", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          warningScreenVisible: true,
          warningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
        }),
        flow: FlowName.send,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: ["Ethereum"],
      }),
    ).toEqual({ status: "skipped" });
  });

  it("skips when the flow is unknown or not covered by the rules", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          warningScreenVisible: true,
          warningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.send],
          },
        }),
        flow: FlowName.unknown,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: [],
      }),
    ).toEqual({ status: "skipped" });

    expect(
      decideDeprecationPresentation({
        rules: createRules({
          warningScreenVisible: true,
          warningScreenRules: {
            exception: [],
            deprecatedFlow: [FlowName.receive],
          },
        }),
        flow: FlowName.send,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: [],
      }),
    ).toEqual({ status: "skipped" });
  });

  it("skips when the currency is explicitly excluded", () => {
    expect(
      decideDeprecationPresentation({
        rules: createRules({
          warningScreenVisible: true,
          warningScreenRules: {
            exception: ["Ethereum"],
            deprecatedFlow: [FlowName.send],
          },
        }),
        flow: FlowName.send,
        currencyName: "Ethereum",
        deprecationDismissedCurrencyNames: [],
      }),
    ).toEqual({ status: "skipped" });
  });
});
