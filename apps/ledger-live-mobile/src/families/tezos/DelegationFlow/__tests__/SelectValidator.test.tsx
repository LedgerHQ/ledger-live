import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen } from "@tests/test-renderer";
import type { AccountLike } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import SelectValidator from "../SelectValidator";
import { ScreenName } from "~/const";

const mockAccount = {
  type: "Account",
  id: "tezos-acc-1",
  currency: getCryptoCurrencyById("tezos"),
  balance: new BigNumber(100),
  spendableBalance: new BigNumber(100),
  operations: [],
} as unknown as AccountLike;

const mockBaker = {
  address: "tz1staking",
  name: "Staking baker",
  logoURL: "",
  nominalYield: "5 %",
  capacityStatus: "normal",
  stakingEnabled: true,
};
const mockUseBakers = jest.fn((_options: unknown) => [mockBaker]);

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useTheme: () => ({ colors: { background: "#000", live: "#0f0", smoke: "#888" } }),
}));

jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    useTranslation: () => ({ t: (key: string) => key }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text>,
  };
});

jest.mock("@ledgerhq/native-ui", () => ({
  __esModule: true,
  Icons: { UserAdd: () => null },
}));

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useBakers: (options: unknown) => mockUseBakers(options),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (t: Record<string, unknown>, patch: Record<string, unknown>) => ({
      ...t,
      ...patch,
    }),
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: { family: "tezos", mode: "delegate", recipient: "" },
    setTransaction: jest.fn(),
    status: { errors: {}, warnings: {} },
    bridgePending: false,
    bridgeError: null,
  }),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: undefined }),
}));

// The custom-address and info modals, and the decorative parts of each row, are irrelevant here.
jest.mock("~/components/InfoModal", () => () => null);
jest.mock("~/components/Button", () => () => null);
jest.mock("~/components/TextInput", () => () => null);
jest.mock("~/components/TranslatedError", () => () => null);
jest.mock("~/components/ExternalLink", () => () => null);
jest.mock("~/icons/Info", () => () => null);
jest.mock("~/families/tezos/BakerImage", () => () => null);
jest.mock("~/components/LText", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
    getFontStyle: () => ({}),
  };
});
jest.mock("~/components/Touchable", () => {
  const { TouchableOpacity } = jest.requireActual("react-native");
  return ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
    <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
  );
});

const makeProps = (params: Record<string, unknown> = {}) => {
  const navigate = jest.fn();
  const props = {
    navigation: { navigate },
    route: {
      key: "k",
      name: ScreenName.DelegationSelectValidator,
      params: {
        accountId: "tezos-acc-1",
        transaction: { family: "tezos", mode: "delegate", recipient: "" },
        ...params,
      },
    },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  } as unknown as React.ComponentProps<typeof SelectValidator>;
  return { props, navigate };
};

describe("Tezos delegation SelectValidator", () => {
  beforeEach(() => {
    mockUseBakers.mockClear();
  });

  it("lists every baker for a plain delegation", () => {
    render(<SelectValidator {...makeProps().props} />);
    expect(mockUseBakers).toHaveBeenCalledWith({ forStaking: false });
    expect(screen.getByText(mockBaker.name)).toBeVisible();
  });

  it("lists the bakers that accept staking when the flow stakes afterwards", () => {
    render(<SelectValidator {...makeProps({ stakeAfter: true }).props} />);
    expect(mockUseBakers).toHaveBeenCalledWith({ forStaking: true });
  });

  it("returns to the summary with the picked baker, still staking afterwards", () => {
    const { props, navigate } = makeProps({ stakeAfter: true });
    render(<SelectValidator {...props} />);
    fireEvent.press(screen.getByText(mockBaker.name));
    expect(navigate).toHaveBeenCalledWith(
      ScreenName.DelegationSummary,
      expect.objectContaining({
        stakeAfter: true,
        transaction: expect.objectContaining({ recipient: mockBaker.address }),
      }),
    );
  });
});
