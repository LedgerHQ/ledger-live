import React from "react";
import { render, screen } from "@tests/test-renderer";
import CeloFeeRow from "../SendRowsFee";
import type { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import type { TokenAccount } from "@ledgerhq/types-live";

jest.mock("~/icons/ExternalLink", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return () => <View testID="external-link-icon" />;
});

jest.mock("~/components/CurrencyUnitValue", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return ({ value, unit }: { value: { toNumber: () => number }; unit: { code: string } }) => (
    <Text>
      {value.toNumber()} {unit?.code}
    </Text>
  );
});

jest.mock("~/components/CounterValue", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return ({ value }: { value: { toNumber: () => number } }) => <Text>≈ ${value.toNumber()}</Text>;
});

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn().mockReturnValue({
    name: "CELO",
    code: "CELO",
    magnitude: 18,
  }),
}));

const mockCeloAccount: CeloAccount = {
  type: "Account",
  id: "celo-account-id",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xabc",
  freshAddressPath: "44'/52752'/0'/0/0",
  used: true,
  balance: { toNumber: () => 1000 } as never,
  spendableBalance: { toNumber: () => 1000 } as never,
  creationDate: new Date(),
  blockHeight: 100000,
  currency: { id: "celo", family: "celo" } as never,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  subAccounts: [],
  celoResources: {
    registrationStatus: false,
    lockedBalance: { toNumber: () => 0 } as never,
    nonvotingLockedBalance: { toNumber: () => 0 } as never,
    pendingWithdrawals: null,
    votes: null,
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: { toNumber: () => 0 } as never,
  },
};

const usdcSubAccount: TokenAccount = {
  type: "TokenAccount",
  id: "usdc-sub-account-id",
  parentId: "celo-account-id",
  token: {
    type: "TokenCurrency",
    id: "celo/erc20/usdc",
    contractAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    parentCurrencyId: "celo",
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
  } as never,
  balance: { toNumber: () => 100 } as never,
  spendableBalance: { toNumber: () => 100 } as never,
  creationDate: new Date(),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};

const accountWithSubAccounts: CeloAccount = {
  ...mockCeloAccount,
  subAccounts: [usdcSubAccount],
};

const baseTransaction = {
  family: "celo" as const,
  amount: { toNumber: () => 0 } as never,
  recipient: "",
  useAllAmount: false,
  mode: "send" as const,
  index: null,
  fees: null,
  feeCurrency: null,
  feeCurrencyUnwrapped: null,
  feeCurrencyAccountId: null,
};

describe("CeloFeeRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without fees when fees is null", () => {
    const status = {
      estimatedFees: { toNumber: () => 0 } as never,
      errors: {},
      warnings: {},
      amount: { toNumber: () => 0 } as never,
      totalSpent: { toNumber: () => 0 } as never,
    };

    render(
      <CeloFeeRow
        account={mockCeloAccount as never}
        transaction={baseTransaction as never}
        status={status as never}
        navigation={{} as never}
        route={{} as never}
      />,
    );

    // Fee row should render with the fee title
    expect(screen.getByText("Network fees")).toBeDefined();
  });

  it("renders the fee amount when fees are present", () => {
    const transaction = {
      ...baseTransaction,
      fees: { toNumber: () => 1000 } as never,
    };
    const status = {
      estimatedFees: { toNumber: () => 1000 } as never,
      errors: {},
      warnings: {},
      amount: { toNumber: () => 0 } as never,
      totalSpent: { toNumber: () => 1000 } as never,
    };

    render(
      <CeloFeeRow
        account={mockCeloAccount as never}
        transaction={transaction as never}
        status={status as never}
        navigation={{} as never}
        route={{} as never}
      />,
    );

    expect(screen.getByText("Network fees")).toBeDefined();
    expect(screen.getByText("1000 CELO")).toBeDefined();
  });

  it("renders fee in the selected fee currency when feeCurrencyAccountId is set", () => {
    const { useAccountUnit } = jest.requireMock("LLM/hooks/useAccountUnit");
    useAccountUnit.mockReturnValue({ name: "USDC", code: "USDC", magnitude: 6 });

    const transaction = {
      ...baseTransaction,
      fees: { toNumber: () => 500000000000000 } as never,
      feeCurrencyAccountId: "usdc-sub-account-id",
    };
    // status.estimatedFees is already converted to 6 decimals by getTransactionStatus
    const status = {
      estimatedFees: { toNumber: () => 500 } as never,
      errors: {},
      warnings: {},
      amount: { toNumber: () => 0 } as never,
      totalSpent: { toNumber: () => 500 } as never,
    };

    render(
      <CeloFeeRow
        account={accountWithSubAccounts as never}
        transaction={transaction as never}
        status={status as never}
        navigation={{} as never}
        route={{} as never}
      />,
    );

    expect(screen.getByText("Network fees")).toBeDefined();
    expect(screen.getByText("500 USDC")).toBeDefined();
  });

  it("renders with parentAccount when provided", () => {
    const status = {
      estimatedFees: { toNumber: () => 0 } as never,
      errors: {},
      warnings: {},
      amount: { toNumber: () => 0 } as never,
      totalSpent: { toNumber: () => 0 } as never,
    };

    render(
      <CeloFeeRow
        account={usdcSubAccount as never}
        parentAccount={mockCeloAccount as never}
        transaction={baseTransaction as never}
        status={status as never}
        navigation={{} as never}
        route={{} as never}
      />,
    );

    expect(screen.getByText("Network fees")).toBeDefined();
  });
});
