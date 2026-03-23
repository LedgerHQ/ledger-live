jest.mock(
  "@ledgerhq/native-ui/pre-ldls",
  () => ({
    CryptoIcon: () => null,
  }),
  { virtual: true },
);

jest.mock("~/components/KeyboardView", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/FocusedTextInput", () => {
  const { TextInput } = require("react-native");
  return { __esModule: true, default: TextInput };
});

jest.mock("~/components/Button", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/CurrencyIcon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/CurrencyUnitValue", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/Circle", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/Touchable", () => {
  const { TouchableOpacity } = require("react-native");
  return { __esModule: true, default: TouchableOpacity };
});

jest.mock("~/components/TranslatedError", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/FirstLetterIcon", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/navigation/navigatorConfig", () => ({
  getStackNavigatorConfig: jest.fn(() => ({})),
}));

jest.mock("~/screens/ConnectDevice", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/screens/SelectDevice", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/StepHeader", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/ValidateError", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/components/ValidateSuccess", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(() => ({ account: null })),
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({ name: "MINA", code: "MINA", magnitude: 9 })),
}));

jest.mock("~/helpers/navigationHelpers", () => ({
  popToScreen: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () =>
  jest.fn(() => ({
    transaction: null,
    setTransaction: jest.fn(),
    status: { errors: {}, warnings: {} },
    bridgePending: false,
    bridgeError: null,
  })),
);

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getAccountCurrency: jest.fn(() => ({
    type: "CryptoCurrency",
    id: "mina",
    ticker: "MINA",
    color: "#E39844",
  })),
  flattenAccounts: jest.fn((accounts: unknown[]) => accounts),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  formatCurrencyUnit: jest.fn(() => "10 MINA"),
  getCurrencyColor: jest.fn(() => "#E39844"),
}));

jest.mock("~/colors", () => ({
  rgba: jest.fn(() => "rgba(0,0,0,0.2)"),
}));

jest.mock("../../tezos/DelegatingContainer", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("../../tron/VoteFlow/01-SelectValidator/SearchBox", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

import * as MinaEditMemo from "../ScreenEditMemo";
import * as MinaStakingFlow from "../StakingFlow";
import * as MinaFamily from "../index";

describe("Mina Family", () => {
  it("should export MinaEditMemo module", () => {
    expect(MinaFamily.MinaEditMemo).toBeDefined();
    expect(MinaFamily.MinaEditMemo).toBe(MinaEditMemo);
  });

  it("should export MinaStakingFlow module", () => {
    expect(MinaFamily.MinaStakingFlow).toBeDefined();
    expect(MinaFamily.MinaStakingFlow).toBe(MinaStakingFlow);
  });

  it("should have component and options in MinaEditMemo", () => {
    expect(MinaFamily.MinaEditMemo.component).toBeDefined();
    expect(MinaFamily.MinaEditMemo.options).toBeDefined();
  });

  it("should have component and options in MinaStakingFlow", () => {
    expect(MinaFamily.MinaStakingFlow.component).toBeDefined();
    expect(MinaFamily.MinaStakingFlow.options).toBeDefined();
  });
});
