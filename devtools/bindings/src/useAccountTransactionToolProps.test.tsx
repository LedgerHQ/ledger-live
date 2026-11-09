import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore, type UnknownAction } from "@reduxjs/toolkit";
import { accountDataExtra } from "@domain/api-account-data";
import type { AccountSendCapability, AccountSendingSource } from "@domain/api-account-transaction";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import type { AccountBalancesState } from "@domain/entity-account-balance";
import { mockAccountAssetBalance } from "@domain/entity-account-balance/schema.mock";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { TransactionHashSchema } from "@domain/entity-account-operation";
import { mockAccountOperation } from "@domain/entity-account-operation/schema.mock";
import { mockPreparedTransaction } from "@domain/entity-account-transaction/schema.mock";
import { of } from "rxjs";
import { useAccountTransactionToolProps } from "./useAccountTransactionToolProps";

const real = mockAddressAccountDescriptor();
const mock = mockAddressAccountDescriptor({ purpose: "mock", network: "polygon" });
const unknown = mockAddressAccountDescriptor({ network: "not_a_network" });
const realUUID = computeAccountUUID(real);
const mockUUID = computeAccountUUID(mock);
const unknownUUID = computeAccountUUID(unknown);
const hash = TransactionHashSchema.parse("0xhash");

const form = {
  assetId: "ethereum",
  recipient: "0xabc",
  amount: "1000",
  useAllAmount: false,
  feeStrategy: "",
  customFees: "",
  feeAssetId: "",
  memo: "",
  memoType: "",
  familyOptions: "",
};

const balancesSet = (payload: AccountBalancesState) => ({ type: "test/balancesSet", payload });

function balancesReducer(state: AccountBalancesState = {}, action: UnknownAction) {
  return action.type === "test/balancesSet" ? (action.payload as AccountBalancesState) : state;
}

/** `mockSourceId` is the source serving mock descriptors: the real mock source is `mock`. */
function setup({ mockSourceId = "mock" } = {}) {
  const send: AccountSendCapability = {
    supports: () => true,
    prepare: jest.fn(async (_target, request) => mockPreparedTransaction({ request })),
    sign: jest.fn(() =>
      of(
        { type: "device-signature-requested" as const },
        { type: "signed" as const, signed: { payload: "signature" } },
      ),
    ),
    broadcast: jest.fn(async () => ({
      hash,
      operations: [mockAccountOperation({ id: "pending", blockHeight: null })],
    })),
    release: jest.fn(),
  };
  const sources: AccountSendingSource[] = [
    {
      id: AccountDataSourceIdSchema.parse(mockSourceId),
      supports: () => true,
      purposes: ["mock"],
      send,
    },
    { id: AccountDataSourceIdSchema.parse("sender"), supports: () => true, send },
  ];
  const store = configureStore({
    reducer: { accountEntries: accountsSlice.reducer, accountBalances: balancesReducer },
    middleware: getDefault => getDefault({ thunk: { extraArgument: accountDataExtra(sources) } }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { accountUUID: realUUID, descriptor: real, legacyId: AccountIdSchema.parse("real") },
      { accountUUID: mockUUID, descriptor: mock, legacyId: AccountIdSchema.parse("mock") },
    ]),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAccountTransactionToolProps(), { wrapper });
  return { result, send, store };
}

describe("useAccountTransactionToolProps", () => {
  it("should list the accounts, only mock ones signing", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([
      {
        accountUUID: realUUID,
        label: "ethereum · account",
        assetIds: ["ethereum"],
        canSign: false,
      },
      { accountUUID: mockUUID, label: "polygon · mock", assetIds: ["polygon"], canSign: true },
    ]);
  });

  it("should list an account of an unknown network with its held assets only, without throwing", () => {
    const { result, store } = setup();
    act(() => {
      store.dispatch(
        legacyAccountsSynced([
          { accountUUID: unknownUUID, descriptor: unknown, legacyId: AccountIdSchema.parse("x") },
        ]),
      );
      store.dispatch(balancesSet({ [unknownUUID]: [mockAccountAssetBalance({ assetId: "foo" })] }));
    });
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ accountUUID: unknownUUID, assetIds: ["foo"] }),
    ]);
  });

  it("should list held tokens after the native coin, and keep the list on a mere amount change", () => {
    const { result, store } = setup();
    const usdc = "ethereum/erc20/usd__coin";
    act(() => {
      store.dispatch(
        balancesSet({
          [realUUID]: [mockAccountAssetBalance(), mockAccountAssetBalance({ assetId: usdc })],
        }),
      );
    });
    const accounts = result.current.accounts;
    expect(accounts[0].assetIds).toEqual(["ethereum", usdc]);

    act(() => {
      store.dispatch(
        balancesSet({
          [realUUID]: [
            mockAccountAssetBalance({ balance: "99" }),
            mockAccountAssetBalance({ assetId: usdc }),
          ],
        }),
      );
    });
    expect(result.current.accounts).toBe(accounts);
  });

  it("should prepare and estimate fees on a real account, but not sign it", async () => {
    const { result, send } = setup();
    const prepared = await act(() => result.current.onPrepare(realUUID, form));
    expect(prepared).toEqual(expect.objectContaining({ sourceId: "sender", errors: [] }));
    await expect(result.current.onEstimateFees(realUUID, form, ["slow"])).resolves.toEqual([]);
    await expect(result.current.onSignAndBroadcast(prepared.preparationId)).rejects.toThrow(
      'Source "sender" signs on a device: it needs the sign Device Intent',
    );
    expect(send.sign).not.toHaveBeenCalled();
  });

  it("should sign a mock account with a simulated signature, then broadcast", async () => {
    const { result, send } = setup();
    const prepared = await act(() => result.current.onPrepare(mockUUID, form));
    expect(prepared.sourceId).toBe("mock");
    await expect(result.current.onSignAndBroadcast(prepared.preparationId)).resolves.toEqual({
      hash: "0xhash",
      pendingRows: 1,
    });
    expect(send.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ accountUUID: mockUUID }),
      expect.anything(),
      { payload: "signature" },
    );
    await expect(result.current.onSignAndBroadcast(prepared.preparationId)).rejects.toThrow(
      "Prepare again",
    );
  });

  it("should not simulate the signature of a mock account another source prepared", async () => {
    const { result, send } = setup({ mockSourceId: "other" });
    const prepared = await act(() => result.current.onPrepare(mockUUID, form));
    await expect(result.current.onSignAndBroadcast(prepared.preparationId)).rejects.toThrow(
      'Source "other" signs on a device',
    );
    expect(send.sign).not.toHaveBeenCalled();
  });

  it("should reject an invalid form with a readable message", async () => {
    const { result } = setup();
    await expect(
      result.current.onPrepare(realUUID, { ...form, customFees: "[1]" }),
    ).rejects.toThrow("Custom fees must be a JSON object");
    await expect(
      result.current.onPrepare(realUUID, { ...form, familyOptions: "{rbf" }),
    ).rejects.toThrow(/^Family options: /);
    await expect(result.current.onPrepare(realUUID, { ...form, memoType: "id" })).rejects.toThrow(
      "Memo type needs a memo",
    );
  });

  it("should trim the memo and leave a blank one out", async () => {
    const { result, send } = setup();
    await act(() => result.current.onPrepare(realUUID, { ...form, memo: " 42 ", memoType: "id" }));
    await act(() => result.current.onPrepare(realUUID, { ...form, memo: "  " }));
    const requests = jest.mocked(send.prepare).mock.calls.map(([, request]) => request);
    expect(requests[0].memo).toEqual({ value: "42", type: "id" });
    expect(requests[1].memo).toBeUndefined();
  });

  it("should fail readably when the simulated signing ends without a signature", async () => {
    const { result, send } = setup();
    jest.mocked(send.sign).mockReturnValue(of({ type: "device-signature-requested" as const }));
    const prepared = await act(() => result.current.onPrepare(mockUUID, form));
    await expect(result.current.onSignAndBroadcast(prepared.preparationId)).rejects.toThrow(
      "Signing ended without a signature",
    );
    expect(send.broadcast).not.toHaveBeenCalled();
  });

  it("should release a preparation once", async () => {
    const { result, send } = setup();
    const prepared = await act(() => result.current.onPrepare(realUUID, form));
    act(() => result.current.onRelease(prepared.preparationId));
    act(() => result.current.onRelease(prepared.preparationId));
    expect(send.release).toHaveBeenCalledTimes(1);
  });
});
