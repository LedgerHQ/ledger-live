import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import { NATIVE_FEE_CURRENCY_MARKER } from "@ledgerhq/live-common/families/celo/constants";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { CeloAccount, CeloOperation } from "@ledgerhq/live-common/families/celo/types";

const mockUseQuery = jest.fn();
const mockUseTokenByAddressInCurrency = jest.fn();
const mockGetCeloTransactionFeeCurrency = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@ledgerhq/cryptoassets/hooks", () => ({
  useTokenByAddressInCurrency: (...args: unknown[]) => mockUseTokenByAddressInCurrency(...args),
}));

jest.mock("@ledgerhq/live-common/families/celo/network", () => ({
  getCeloTransactionFeeCurrency: (...args: unknown[]) => mockGetCeloTransactionFeeCurrency(...args),
}));

import operationDetails from "../operationDetails";

const { getDisplayFee, useFeesCurrency } = operationDetails;

const celo = getCryptoCurrencyById("celo");

const buildOperation = (
  overrides: Partial<CeloOperation> & Partial<{ feeCurrencyAddress: string }> = {},
): CeloOperation => ({
  id: "celo:test-op",
  hash: "0xhash",
  type: "OUT",
  value: new BigNumber(0),
  fee: new BigNumber(0),
  senders: [],
  recipients: [],
  blockHeight: 100,
  blockHash: null,
  accountId: "celo:test-account",
  date: new Date("2026-01-01"),
  hasFailed: false,
  ...overrides,
  extra:
    overrides.extra ??
    (overrides.feeCurrencyAddress != null
      ? { feeCurrencyAddress: overrides.feeCurrencyAddress }
      : {}),
});

const buildToken = (
  contractAddress: string,
  magnitude = 6,
  id = "celo/erc20/test",
): TokenCurrency => ({
  type: "TokenCurrency",
  id,
  contractAddress,
  parentCurrencyId: celo.id,
  tokenType: "erc20",
  name: "Test Token",
  ticker: "TST",
  units: [{ name: "Test Token", code: "TST", magnitude }],
});

const buildTokenAccount = (token: TokenCurrency): TokenAccount => ({
  type: "TokenAccount",
  id: `js:2:celo:0xtest:+${token.id}`,
  parentId: "celo:test-account",
  token,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  creationDate: new Date("2026-01-01"),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: emptyHistoryCache,
  swapHistory: [],
});

const buildAccount = (subAccounts: TokenAccount[] = []): CeloAccount => ({
  type: "Account",
  id: "celo:test-account",
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xabc",
  freshAddressPath: "44'/52752'/0'/0/0",
  used: true,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  creationDate: new Date("2026-01-01"),
  blockHeight: 100,
  currency: celo,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date("2026-01-01"),
  balanceHistoryCache: emptyHistoryCache,
  swapHistory: [],
  subAccounts,
  celoResources: {
    registrationStatus: false,
    lockedBalance: new BigNumber(0),
    nonvotingLockedBalance: new BigNumber(0),
    pendingWithdrawals: null,
    votes: null,
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: new BigNumber(0),
  },
});

describe("celo desktop operationDetails.getDisplayFee", () => {
  const account = buildAccount();

  it("returns undefined for a native CryptoCurrency", () => {
    expect(
      getDisplayFee(buildOperation({ fee: new BigNumber("1000000000000000000") }), account, celo),
    ).toBeUndefined();
  });

  it("returns undefined when the token magnitude is exactly 18", () => {
    expect(
      getDisplayFee(
        buildOperation({ fee: new BigNumber("1000000000000000000") }),
        account,
        buildToken("0xc0ffee", 18),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when the token magnitude is missing", () => {
    const token: TokenCurrency = { ...buildToken("0xc0ffee"), units: [] };
    expect(
      getDisplayFee(buildOperation({ fee: new BigNumber("1000000000000000000") }), account, token),
    ).toBeUndefined();
  });

  it("rescales a 6-decimal token fee from 18-decimal units (USDC-like)", () => {
    expect(
      getDisplayFee(
        buildOperation({ fee: new BigNumber("1000000000000000000") }),
        account,
        buildToken("0xc0ffee", 6),
      )?.toFixed(),
    ).toBe("1000000");
  });

  it("floors the result for non-exact divisions", () => {
    // For magnitude 6 the divisor is 1e12; (1e12 + 1) / 1e12 = 1.000…001 → 1.
    expect(
      getDisplayFee(
        buildOperation({ fee: new BigNumber("1000000000001") }),
        account,
        buildToken("0xc0ffee", 6),
      )?.toFixed(),
    ).toBe("1");
  });

  it("rescales an 8-decimal token fee correctly", () => {
    expect(
      getDisplayFee(
        buildOperation({ fee: new BigNumber("500000000000000000") }),
        account,
        buildToken("0xc0ffee", 8),
      )?.toFixed(),
    ).toBe("50000000");
  });
});

describe("celo desktop operationDetails.useFeesCurrency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined });
    mockUseTokenByAddressInCurrency.mockReturnValue({ token: undefined });
  });

  it("returns undefined when the stored marker is NATIVE", () => {
    const account = buildAccount();
    const operation = buildOperation({ feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER });

    const { result } = renderHook(() => useFeesCurrency(operation, account));

    expect(result.current).toBeUndefined();
    // No RPC fetch needed when a stored address is present.
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it("returns undefined when neither stored nor fetched address is available", () => {
    const account = buildAccount();
    const operation = buildOperation();

    const { result } = renderHook(() => useFeesCurrency(operation, account));

    expect(result.current).toBeUndefined();
  });

  it("returns the matching subAccount token when the adapter is a known token contract", () => {
    const adapter = "0xabcdef0123456789abcdef0123456789abcdef01";
    const token = buildToken(adapter);
    const account = buildAccount([buildTokenAccount(token)]);
    const operation = buildOperation({ feeCurrencyAddress: adapter });

    const { result } = renderHook(() => useFeesCurrency(operation, account));

    expect(result.current).toBe(token);
  });

  it("falls back to the CAL token when no subAccount matches", () => {
    const adapter = "0xabcdef0123456789abcdef0123456789abcdef01";
    const calToken = buildToken(adapter, 6, "celo/erc20/cal");
    mockUseTokenByAddressInCurrency.mockReturnValue({ token: calToken });
    const account = buildAccount(); // no subAccounts
    const operation = buildOperation({ feeCurrencyAddress: adapter });

    const { result } = renderHook(() => useFeesCurrency(operation, account));

    expect(result.current).toBe(calToken);
    expect(mockUseTokenByAddressInCurrency).toHaveBeenCalledWith(adapter, "celo", { skip: false });
  });

  it("uses the fetched address when nothing is stored on the operation", () => {
    const adapter = "0xabcdef0123456789abcdef0123456789abcdef01";
    const token = buildToken(adapter);
    const account = buildAccount([buildTokenAccount(token)]);
    const operation = buildOperation();
    mockUseQuery.mockReturnValue({ data: adapter });

    const { result } = renderHook(() => useFeesCurrency(operation, account));

    expect(result.current).toBe(token);
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });

  it("disables the RPC fetch when the operation has no block height", () => {
    const account = buildAccount();
    const operation = buildOperation({ blockHeight: null });

    renderHook(() => useFeesCurrency(operation, account));

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
