import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import type { Account, AccountLike, Operation, TokenAccount } from "@ledgerhq/types-live";
import { getBridgeApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/bridge";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import Content from "./Content";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ isEditableOperation: () => false, isStuckOperation: () => false }),
}));

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/bridge", () => ({
  getBridgeApi: jest.fn(),
}));
const mockGetBridgeApi = jest.mocked(getBridgeApi);

// The currency and value each counter-value is computed from.
jest.mock("~/components/CounterValue", () => ({
  __esModule: true,
  default: ({ currency, value }: { currency: { id: string }; value: BigNumber }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{`countervalue ${currency.id} ${value.toFixed()}`}</Text>;
  },
}));

beforeEach(() => {
  mockGetBridgeApi.mockReset();
  mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset: async () => undefined });
});

const ethereum = getCryptoCurrencyById("ethereum");
const CONTRACT = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const usdc: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
  contractAddress: CONTRACT,
  parentCurrencyId: ethereum.id,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

const ethAccount = genAccount("token-fee-details", { currency: ethereum, operationsSize: 0 });
const ACCOUNT_ID = ethAccount.id;
const TOKEN_ACCOUNT_ID = encodeTokenAccountId(ACCOUNT_ID, usdc);
// A fee of 0.001601 USDC, paid by the account
const feeExtra = {
  feeAsset: { type: "erc20", assetReference: CONTRACT },
  feeAmount: "1601",
  feePayer: ethAccount.freshAddress,
};

const baseOperation = {
  hash: "0xhash",
  senders: [ethAccount.freshAddress],
  recipients: ["0xdef"],
  blockHash: "hash",
  blockHeight: 90,
  date: new Date(),
};

// The native operation of the transaction: its fee is out of `fee`, in `extra`
const nativeOperation = {
  ...baseOperation,
  id: `${ACCOUNT_ID}-0xhash-OUT`,
  accountId: ACCOUNT_ID,
  type: "OUT",
  value: new BigNumber(1000),
  fee: new BigNumber(0),
  extra: feeExtra,
} as unknown as Operation;

// The fee charged in the token's sub-account
const feesOperation = {
  ...baseOperation,
  id: `${TOKEN_ACCOUNT_ID}-0xhash-FEES`,
  accountId: TOKEN_ACCOUNT_ID,
  type: "FEES",
  value: new BigNumber(1601),
  fee: new BigNumber(1601),
  recipients: [],
  extra: { ...feeExtra, ledgerOpType: "FEES", assetReference: CONTRACT },
} as unknown as Operation;

// A transaction that paid its fee in the native coin
const nativeFeeOperation = {
  ...baseOperation,
  id: `${ACCOUNT_ID}-0xnative-OUT`,
  hash: "0xnative",
  accountId: ACCOUNT_ID,
  type: "OUT",
  value: new BigNumber("1000000000000000"),
  fee: new BigNumber("21000000000000"),
  extra: {},
} as unknown as Operation;

const tokenAccount = {
  type: "TokenAccount",
  id: TOKEN_ACCOUNT_ID,
  parentId: ACCOUNT_ID,
  token: usdc,
  balance: new BigNumber(1_000_000),
  spendableBalance: new BigNumber(1_000_000),
  creationDate: new Date(),
  operationsCount: 1,
  operations: [feesOperation],
  pendingOperations: [],
  swapHistory: [],
} as unknown as TokenAccount;

const accountWith = (subAccounts: TokenAccount[]): Account => ({
  ...ethAccount,
  operations: [nativeOperation, nativeFeeOperation],
  pendingOperations: [],
  subAccounts,
});

const Stack = createNativeStackNavigator();

const renderContent = (mainAccount: Account, operation: Operation, account?: AccountLike) => {
  const shown = account ?? mainAccount;
  const Screen = () => (
    <Content
      account={shown}
      parentAccount={shown === mainAccount ? null : mainAccount}
      mainAccount={mainAccount}
      operation={operation}
      currency={shown.type === "TokenAccount" ? shown.token : mainAccount.currency}
    />
  );
  return render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.OperationDetails} component={Screen} />
    </Stack.Navigator>,
  );
};

describe("OperationDetails content, fee paid in a token", () => {
  it("shows the fee of a FEES operation of a token account in that token", async () => {
    const mainAccount = accountWith([tokenAccount]);
    renderContent(mainAccount, feesOperation, tokenAccount);

    expect(await screen.findByTestId("operationDetails-fees")).toHaveTextContent(
      /0\.001601\s*USDC/,
    );
    expect(screen.getByText(`countervalue ${usdc.id} 1601`)).toBeOnTheScreen();
  });

  it("shows the fee of the native operation in the token, read from the operation", async () => {
    renderContent(accountWith([tokenAccount]), nativeOperation);

    expect(await screen.findByTestId("operationDetails-fees")).toHaveTextContent(
      /0\.001601\s*USDC/,
    );
    expect(screen.getByText(`countervalue ${usdc.id} 1601`)).toBeOnTheScreen();
    expect(mockGetBridgeApi).not.toHaveBeenCalled();
  });

  it("resolves the token of a fee no sub-account was charged with", async () => {
    mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset: async () => usdc });

    renderContent(accountWith([]), nativeOperation);

    expect(await screen.findByText(`countervalue ${usdc.id} 1601`)).toBeOnTheScreen();
    expect(screen.getByTestId("operationDetails-fees")).toHaveTextContent(/0\.001601\s*USDC/);
  });

  it("shows no fee for a token the family does not know, rather than one in ETH", async () => {
    const getTokenFromAsset = jest.fn(async () => undefined);
    mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset });

    renderContent(accountWith([]), nativeOperation);

    await screen.findByTestId("operationDetails-amount");
    await waitFor(() => expect(getTokenFromAsset).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByTestId("operationDetails-fees")).toBeNull();
    expect(screen.queryByText(`countervalue ${ethereum.id} 0`)).toBeNull();
  });

  it("shows a native fee in the native coin, as before", async () => {
    renderContent(accountWith([tokenAccount]), nativeFeeOperation);

    expect(await screen.findByTestId("operationDetails-fees")).toHaveTextContent(/0\.000021\s*ETH/);
    expect(screen.getByText(`countervalue ${ethereum.id} 21000000000000`)).toBeOnTheScreen();
    expect(mockGetBridgeApi).not.toHaveBeenCalled();
  });

  it("shows the fee of a fee-only native operation in the token", async () => {
    mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset: async () => usdc });
    const carrier = {
      ...nativeOperation,
      id: `${ACCOUNT_ID}-0xhash-NONE`,
      type: "NONE",
      value: new BigNumber(0),
    } as Operation;

    renderContent({ ...accountWith([]), operations: [carrier] }, carrier);

    expect(await screen.findByText(`countervalue ${usdc.id} 1601`)).toBeOnTheScreen();
    expect(screen.getByTestId("operationDetails-fees")).toHaveTextContent(/0\.001601\s*USDC/);
  });

  it("shows the fee of a pending operation in the native coin, as before", async () => {
    // As the generic bridge builds it before the broadcast: no hash, no block, no fee asset
    const pending = {
      ...nativeFeeOperation,
      id: `${ACCOUNT_ID}--OUT`,
      hash: "",
      blockHash: null,
      blockHeight: null,
      extra: { ledgerOpType: "OUT", blockTime: new Date(), index: "0" },
    } as Operation;
    const mainAccount = { ...accountWith([tokenAccount]), pendingOperations: [pending] };

    renderContent(mainAccount, pending);

    expect(await screen.findByTestId("operationDetails-fees")).toHaveTextContent(/0\.000021\s*ETH/);
    expect(screen.getByText(`countervalue ${ethereum.id} 21000000000000`)).toBeOnTheScreen();
  });
});
