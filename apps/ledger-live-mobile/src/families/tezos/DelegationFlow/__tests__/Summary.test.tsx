import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { AccountLike } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import DelegationSummary from "../Summary";
import { ScreenName } from "~/const";

const mockAccount = {
  type: "Account",
  id: "tezos-acc-1",
  currency: getCryptoCurrencyById("tezos"),
  balance: new BigNumber(100),
  spendableBalance: new BigNumber(100),
  operations: [],
} as unknown as AccountLike;

let mockTransaction: Record<string, unknown>;
let mockStakingInfo: { unstakingPositions: { uid: string; delegate?: string }[] };
const mockStatus = { errors: {}, warnings: {} };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useTheme: () => ({ colors: { background: "#000", live: "#0f0", grey: "#888", white: "#fff" } }),
}));

jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    useTranslation: () => ({ t: (key: string) => key }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text>,
  };
});

// native-ui Alert renders its `title`; we assert on that. Icons.PenEdit is used in the summary body.
jest.mock("@ledgerhq/native-ui", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    Alert: ({ title }: { title?: React.ReactNode }) => <Text>{title}</Text>,
    Icons: { PenEdit: () => null },
  };
});

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useTezosStakingInfo: () => mockStakingInfo,
  useDelegation: () => null,
  useStakingPositions: () => [],
  useBaker: () => null,
  useBakers: () => [],
  isUnstakingPosition: (uid: string) => uid.startsWith("unstaking-"),
}));

jest.mock("@ledgerhq/live-common/families/tezos/staking", () => ({ whitelist: [] }));

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
    transaction: mockTransaction,
    setTransaction: jest.fn(),
    status: mockStatus,
    bridgePending: false,
    bridgeError: null,
  }),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: undefined }),
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "XTZ", name: "tez", magnitude: 6 }),
}));

jest.mock("~/reducers/wallet", () => ({
  ...jest.requireActual("~/reducers/wallet"),
  useAccountName: () => "My Tezos Account",
}));

jest.mock("~/logic/screenTransactionHooks", () => ({
  useTransactionChangeFromNavigation: () => {},
}));

jest.mock("~/analytics", () => ({ TrackScreen: () => null }));

// Body/footer siblings irrelevant to the warning under test (mocked via ~/ paths = same modules).
jest.mock("~/families/tezos/DelegatingContainer", () => () => null);
jest.mock("~/families/tezos/BakerImage", () => () => null);
jest.mock("~/families/shared/StakingErrors/NotEnoughFundFeesAlert", () => () => null);
jest.mock("~/families/shared/useChangeValidatorRotateAnim", () => ({
  useChangeValidatorRotateAnim: () => ({ rotate: 0, resetRotation: jest.fn() }),
}));
jest.mock("~/components/TranslatedError", () => () => null);
jest.mock("~/components/SupportLinkError", () => () => null);
jest.mock("~/components/Button", () => () => null);
// Decorative body components (rendered only inside the nulled DelegatingContainer) that pull
// heavy native-ui chains; stub them so the module graph stays light.
jest.mock("~/components/CurrencyIcon", () => () => null);
jest.mock("~/components/CurrencyUnitValue", () => () => null);
jest.mock("~/components/Circle", () => () => null);
jest.mock("~/components/LText", () => {
  const { Text } = jest.requireActual("react-native");
  return ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
});
jest.mock("~/components/Touchable", () => {
  const { TouchableOpacity } = jest.requireActual("react-native");
  return ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
    <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
  );
});

const WARNING_KEY = "tezos.delegation.pendingUnstakeWarning";

const makeProps = () =>
  ({
    navigation: { navigate: jest.fn() },
    route: { key: "k", name: ScreenName.DelegationSummary, params: { accountId: "tezos-acc-1" } },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }) as unknown as React.ComponentProps<typeof DelegationSummary>;

describe("Tezos DelegationSummary — pending-unstake warning", () => {
  beforeEach(() => {
    mockTransaction = { family: "tezos", mode: "delegate", recipient: "tz1NEW" };
    mockStakingInfo = { unstakingPositions: [] };
  });

  it("warns when an unfinalizable unstake to a different validator is pending", () => {
    mockStakingInfo = { unstakingPositions: [{ uid: "unstaking-1", delegate: "tz1OLD" }] };
    render(<DelegationSummary {...makeProps()} />);
    expect(screen.getByText(WARNING_KEY)).toBeVisible();
  });

  it("does not warn without a pending unstake", () => {
    mockStakingInfo = { unstakingPositions: [] };
    render(<DelegationSummary {...makeProps()} />);
    expect(screen.queryByText(WARNING_KEY)).toBeNull();
  });

  it("does not warn when the selected validator matches the pending unstake's delegate", () => {
    mockTransaction = { family: "tezos", mode: "delegate", recipient: "tz1SAME" };
    mockStakingInfo = { unstakingPositions: [{ uid: "unstaking-1", delegate: "tz1SAME" }] };
    render(<DelegationSummary {...makeProps()} />);
    expect(screen.queryByText(WARNING_KEY)).toBeNull();
  });

  it("does not warn when the unstake is already finalizable", () => {
    mockStakingInfo = { unstakingPositions: [{ uid: "finalizable-1", delegate: "tz1OLD" }] };
    render(<DelegationSummary {...makeProps()} />);
    expect(screen.queryByText(WARNING_KEY)).toBeNull();
  });
});
