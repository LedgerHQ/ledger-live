/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getBridgeApi } from "./bridge";
import { readOperationFee, useOperationFeeCurrency } from "./operationFee";

jest.mock("./bridge", () => ({ getBridgeApi: jest.fn() }));
const mockGetBridgeApi = jest.mocked(getBridgeApi);
const getTokenFromAsset = jest.fn();

const feeAsset = { type: "erc20", assetReference: "0xfee" };
const token = { type: "TokenCurrency", id: "chain/erc20/fee", ticker: "FEE" } as TokenCurrency;
const otherToken = { type: "TokenCurrency", id: "chain/erc20/other" } as TokenCurrency;

const operation = (overrides: Partial<Operation> = {}): Operation =>
  ({
    id: "op",
    hash: "0xhash",
    type: "OUT",
    fee: new BigNumber(0),
    extra: { feeAsset, feeAmount: "1601" },
    ...overrides,
  }) as Operation;

const tokenAccount = (tokenCurrency: TokenCurrency, operations: Operation[]): TokenAccount =>
  ({ type: "TokenAccount", token: tokenCurrency, operations }) as unknown as TokenAccount;

const account = (subAccounts: TokenAccount[] = []): Account =>
  ({ currency: { id: "chain", family: "evm" }, subAccounts }) as unknown as Account;

/** A promise and the function that resolves it. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(settle => {
    resolve = settle;
  });
  return { promise, resolve };
}

beforeEach(() => {
  getTokenFromAsset.mockReset();
  mockGetBridgeApi.mockReset();
  mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset });
});

describe("readOperationFee", () => {
  it("reads a fee in another asset", () => {
    expect(readOperationFee(operation())).toEqual({
      asset: feeAsset,
      amount: new BigNumber(1601),
    });
  });

  it.each([
    ["no extra", undefined],
    ["no fee asset", {}],
    ["a native fee asset", { feeAsset: { type: "native" }, feeAmount: "1" }],
    ["a fee asset as a contract string", { feeAsset: "0xfee", feeAmount: "1" }],
    ["no fee amount", { feeAsset }],
    ["a fee amount that is not an integer", { feeAsset, feeAmount: "1.5" }],
  ])("reads nothing from %s", (_case, extra) => {
    expect(readOperationFee(operation({ extra }))).toBeUndefined();
  });
});

describe("useOperationFeeCurrency", () => {
  it("leaves a native fee to the native coin", () => {
    const { result } = renderHook(() =>
      useOperationFeeCurrency(operation({ extra: {} }), account()),
    );

    expect(result.current).toBeUndefined();
    expect(mockGetBridgeApi).not.toHaveBeenCalled();
  });

  it("shows the fee in the token of the sub-account charged with it", () => {
    const fees = operation({ id: "fees", type: "FEES" });
    const charged = account([
      tokenAccount(otherToken, [operation({ id: "transfer" })]),
      tokenAccount(token, [fees]),
    ]);

    const { result } = renderHook(() => useOperationFeeCurrency(operation(), charged));

    expect(result.current).toEqual({ currency: token, amount: new BigNumber(1601) });
    expect(mockGetBridgeApi).not.toHaveBeenCalled();
  });

  it("resolves the token of a fee no sub-account was charged with", async () => {
    getTokenFromAsset.mockResolvedValue(token);
    const uncharged = account();

    const { result, rerender } = renderHook(
      ({ op }: { op: Operation }) => useOperationFeeCurrency(op, uncharged),
      { initialProps: { op: operation() } },
    );

    expect(result.current).toBeNull();
    await waitFor(() =>
      expect(result.current).toEqual({ currency: token, amount: new BigNumber(1601) }),
    );
    expect(mockGetBridgeApi).toHaveBeenCalledWith({ id: "chain", family: "evm" }, "evm");
    expect(getTokenFromAsset).toHaveBeenCalledWith(feeAsset);

    // A sync gives the same operation as a new object.
    rerender({ op: operation() });
    expect(result.current).toEqual({ currency: token, amount: new BigNumber(1601) });
    expect(getTokenFromAsset).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["an unknown token", () => getTokenFromAsset.mockResolvedValue(undefined)],
    ["a failed lookup", () => getTokenFromAsset.mockRejectedValue(new Error("down"))],
    ["a family without token lookup", () => mockGetBridgeApi.mockResolvedValue({})],
  ])("shows no fee for %s", async (_case, arrange) => {
    arrange();
    const [op, uncharged] = [operation(), account()];

    const { result } = renderHook(() => useOperationFeeCurrency(op, uncharged));

    await waitFor(() => expect(mockGetBridgeApi).toHaveBeenCalled());
    await act(async () => {});
    expect(result.current).toBeNull();
    expect(mockGetBridgeApi).toHaveBeenCalledTimes(1);
  });

  it("shows no token resolved for another operation", async () => {
    const first = deferred<TokenCurrency>();
    getTokenFromAsset.mockReturnValueOnce(first.promise).mockReturnValueOnce(new Promise(() => {}));
    const uncharged = account();
    const { result, rerender } = renderHook(
      ({ op }: { op: Operation }) => useOperationFeeCurrency(op, uncharged),
      { initialProps: { op: operation({ id: "first" }) } },
    );

    rerender({ op: operation({ id: "second" }) });
    await act(async () => first.resolve(token));

    expect(result.current).toBeNull();
  });

  it("shows no token resolved for another fee asset of the same operation", async () => {
    getTokenFromAsset.mockResolvedValueOnce(token).mockReturnValueOnce(new Promise(() => {}));
    const uncharged = account();
    const { result, rerender } = renderHook(
      ({ op }: { op: Operation }) => useOperationFeeCurrency(op, uncharged),
      { initialProps: { op: operation() } },
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    const otherAsset = { type: "erc20", assetReference: "0xother" };
    rerender({ op: operation({ extra: { feeAsset: otherAsset, feeAmount: "7" } }) });

    expect(result.current).toBeNull();
    await waitFor(() => expect(getTokenFromAsset).toHaveBeenLastCalledWith(otherAsset));
    expect(result.current).toBeNull();
  });
});
