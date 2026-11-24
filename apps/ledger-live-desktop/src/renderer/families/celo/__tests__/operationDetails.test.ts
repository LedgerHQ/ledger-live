import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import { NATIVE_FEE_CURRENCY_MARKER } from "@ledgerhq/live-common/families/celo/constants";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { CeloAccount, CeloOperation } from "@ledgerhq/live-common/families/celo/types";

const mockUseFindTokenByAddressInCurrencyQuery = jest.fn();

jest.mock("@domain/api-currency-token", () => ({
  useFindTokenByAddressInCurrencyQuery: (...args: unknown[]) =>
    mockUseFindTokenByAddressInCurrencyQuery(...args),
}));

import operationDetails from "../operationDetails";

const { getDisplayFee, useFeesCurrency } = operationDetails;

const celo = getCryptoCurrencyById("celo");

const buildOperation = (
  overrides: Partial<CeloOperation> &
    Partial<{ feeCurrencyAddress: string; feeAsset: string }> = {},
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
  extra: overrides.extra ?? {
    ...(overrides.feeCurrencyAddress != null
      ? { feeCurrencyAddress: overrides.feeCurrencyAddress }
      : {}),
    ...(overrides.feeAsset != null ? { feeAsset: overrides.feeAsset } : {}),
  },
});

const buildToken = (
  contractAddress: string,
  magnitude = 6,
  id = "celo/erc20/test",
): TokenCurrency => ({
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(id),
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

const ADAPTER = "0xabcdef0123456789abcdef0123456789abcdef01";
const USDC_ADAPTER = "0x2f25deb3848c207fc8e0c34035b3ba7fc157602b";
const USDC = "0xceba9300f2b948710d2653dd7b07f33a8b32118c";
// A pending operation built before `feeAsset` existed: its fee is in the adapter's 18 decimals
const legacyPending = (fee: string) =>
  buildOperation({ fee: new BigNumber(fee), feeCurrencyAddress: ADAPTER });

describe("celo desktop operationDetails.getDisplayFee", () => {
  const account = buildAccount();

  it("returns undefined for a fee already in its token's units", () => {
    expect(
      getDisplayFee(
        buildOperation({ fee: new BigNumber("1601"), feeAsset: ADAPTER }),
        account,
        buildToken(ADAPTER, 6),
      ),
    ).toBeUndefined();
  });

  it("returns undefined for a native CryptoCurrency", () => {
    expect(getDisplayFee(legacyPending("1000000000000000000"), account, celo)).toBeUndefined();
  });

  it("returns undefined when the token magnitude is exactly 18", () => {
    expect(
      getDisplayFee(legacyPending("1000000000000000000"), account, buildToken("0xc0ffee", 18)),
    ).toBeUndefined();
  });

  it("returns undefined when the token magnitude is missing", () => {
    const token: TokenCurrency = { ...buildToken("0xc0ffee"), units: [] };
    expect(getDisplayFee(legacyPending("1000000000000000000"), account, token)).toBeUndefined();
  });

  it("rescales a 6-decimal token fee from 18-decimal units (USDC-like)", () => {
    expect(
      getDisplayFee(
        legacyPending("1000000000000000000"),
        account,
        buildToken("0xc0ffee", 6),
      )?.toFixed(),
    ).toBe("1000000");
  });

  it("floors the result for non-exact divisions", () => {
    // For magnitude 6 the divisor is 1e12; (1e12 + 1) / 1e12 = 1.000…001 → 1.
    expect(
      getDisplayFee(legacyPending("1000000000001"), account, buildToken("0xc0ffee", 6))?.toFixed(),
    ).toBe("1");
  });

  it("rescales an 8-decimal token fee correctly", () => {
    expect(
      getDisplayFee(
        legacyPending("500000000000000000"),
        account,
        buildToken("0xc0ffee", 8),
      )?.toFixed(),
    ).toBe("50000000");
  });
});

describe("celo desktop operationDetails.useFeesCurrency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({ data: undefined });
  });

  it("returns undefined for a fee paid in CELO", () => {
    const { result } = renderHook(() => useFeesCurrency(buildOperation(), buildAccount()));

    expect(result.current).toBeUndefined();
    expect(mockUseFindTokenByAddressInCurrencyQuery).toHaveBeenCalledWith(
      { contract_address: "", network: "celo" },
      { skip: true },
    );
  });

  it("returns undefined for the NATIVE marker of an older pending operation", () => {
    const operation = buildOperation({ feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER });

    const { result } = renderHook(() => useFeesCurrency(operation, buildAccount()));

    expect(result.current).toBeUndefined();
  });

  it("returns the sub-account token of the fee asset", () => {
    const token = buildToken(ADAPTER);
    const account = buildAccount([buildTokenAccount(token)]);

    const { result } = renderHook(() =>
      useFeesCurrency(buildOperation({ feeAsset: ADAPTER }), account),
    );

    expect(result.current).toBe(token);
    expect(mockUseFindTokenByAddressInCurrencyQuery).toHaveBeenCalledWith(
      { contract_address: ADAPTER, network: "celo" },
      { skip: true },
    );
  });

  it("falls back to the CAL token when no sub-account holds the fee asset", () => {
    const calToken = buildToken(ADAPTER, 6, "celo/erc20/cal");
    mockUseFindTokenByAddressInCurrencyQuery.mockReturnValue({ data: calToken });

    const { result } = renderHook(() =>
      useFeesCurrency(buildOperation({ feeAsset: ADAPTER }), buildAccount()),
    );

    expect(result.current).toBe(calToken);
    expect(mockUseFindTokenByAddressInCurrencyQuery).toHaveBeenCalledWith(
      { contract_address: ADAPTER, network: "celo" },
      { skip: false },
    );
  });

  it("returns null while the fee token is not resolved, so no fee shows in CELO", () => {
    const { result } = renderHook(() =>
      useFeesCurrency(buildOperation({ feeAsset: ADAPTER }), buildAccount()),
    );

    expect(result.current).toBeNull();
  });

  it("resolves the token behind the adapter of an older pending operation", () => {
    const token = buildToken(USDC);
    const account = buildAccount([buildTokenAccount(token)]);

    const { result } = renderHook(() =>
      useFeesCurrency(buildOperation({ feeCurrencyAddress: USDC_ADAPTER }), account),
    );

    expect(result.current).toBe(token);
  });
});
