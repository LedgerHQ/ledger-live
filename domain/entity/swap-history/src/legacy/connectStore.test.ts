import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { computeAccountUUID, type AccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { initialSwapHistoryState } from "../schema";
import { swapHistorySlice } from "../slice";
import {
  connectSwapHistoryStore,
  type LegacySwapAccount,
  type LegacySwapOperation,
} from "./connectStore";

/** A `BigNumber` stand-in: `toFixed(0)` drops the decimals. */
class Amount {
  constructor(private readonly value: string) {}
  toFixed(): string;
  toFixed(decimalPlaces: number): string;
  toFixed(decimalPlaces?: number): string {
    return decimalPlaces === 0 ? this.value.split(".")[0] : this.value;
  }
}

const ethId = "js:2:ethereum:0x71:";
const usdcId = `${ethId}+ethereum%2Ferc20%2Fusd__coin`;
const btcId = "js:2:bitcoin:xpub:native_segwit";
const ethUUID = computeAccountUUID(mockAddressAccountDescriptor());
const btcUUID = computeAccountUUID(mockUtxoAccountDescriptor());

const swap = (overrides: Partial<LegacySwapOperation> = {}): LegacySwapOperation => ({
  swapId: "swap-1",
  provider: "changelly",
  status: "pending",
  receiverAccountId: btcId,
  operationId: `${ethId}-0xabc-OUT`,
  fromAmount: new Amount("1000"),
  toAmount: new Amount("20.75"),
  ...overrides,
});

const ethAccount = (swapHistory: LegacySwapOperation[] = []): LegacySwapAccount => ({
  id: ethId,
  currency: { id: "ethereum" },
  swapHistory,
  subAccounts: [{ id: usdcId, token: { id: "ethereum/erc20/usd__coin" }, swapHistory: [] }],
});
const btcAccount: LegacySwapAccount = { id: btcId, currency: { id: "bitcoin" }, swapHistory: [] };

type Known = Partial<Record<string, AccountUUID>>;
const initialLegacy: { accounts: LegacySwapAccount[]; known: Known } = {
  accounts: [btcAccount],
  known: { [ethId]: ethUUID, [btcId]: btcUUID },
};
const legacy = createSlice({
  name: "legacy",
  initialState: initialLegacy,
  reducers: {
    replaceAccounts: (state, { payload }: PayloadAction<LegacySwapAccount[]>) => ({
      ...state,
      accounts: payload,
    }),
    replaceKnown: (state, { payload }: PayloadAction<Known>) => ({ ...state, known: payload }),
  },
});
const { replaceAccounts, replaceKnown } = legacy.actions;
const { selectAccountSwapHistory, selectSwapHistoryEntries } = swapHistorySlice.selectors;

function setup(accounts: LegacySwapAccount[]) {
  const store = configureStore({
    reducer: { legacy: legacy.reducer, swapHistory: swapHistorySlice.reducer },
    // The legacy amounts are BigNumber instances, as in the apps.
    middleware: getDefault => getDefault({ serializableCheck: false }),
  });
  store.dispatch(replaceAccounts(accounts));
  const onError = jest.fn();
  const dispatch = jest.spyOn(store, "dispatch");
  const disconnect = connectSwapHistoryStore(store, {
    selectLegacyAccounts: state => state.legacy.accounts,
    toAccountUUID: (state, legacyId) => state.legacy.known[legacyId],
    selectAccountIndex: state => state.legacy.known,
    onError,
  });
  return { store, onError, dispatch, disconnect };
}

describe("connectSwapHistoryStore", () => {
  it("mirrors a swap of an account, keyed by AccountUUID", () => {
    const { store } = setup([ethAccount([swap()]), btcAccount]);
    expect(selectAccountSwapHistory(store.getState(), ethUUID)).toEqual([
      {
        swapId: "swap-1",
        provider: "changelly",
        status: "pending",
        accountUUID: ethUUID,
        assetId: "ethereum",
        toAccountUUID: btcUUID,
        toAssetId: "bitcoin",
        operationId: `${ethId}-0xabc-OUT`,
        fromAmount: "1000",
        toAmount: "20",
      },
    ]);
  });

  it("mirrors a token account's swap on its parent, with the token as asset", () => {
    const account = ethAccount();
    const withToken: LegacySwapAccount = {
      ...account,
      subAccounts: [
        { id: usdcId, token: { id: "ethereum/erc20/usd__coin" }, swapHistory: [swap()] },
      ],
    };
    const { store } = setup([withToken, btcAccount]);
    expect(selectAccountSwapHistory(store.getState(), ethUUID)).toMatchObject([
      { accountUUID: ethUUID, assetId: "ethereum/erc20/usd__coin" },
    ]);
  });

  it("keeps the token to receive, the sender and the provider's final amount", () => {
    const { store } = setup([
      ethAccount(),
      {
        ...btcAccount,
        swapHistory: [
          swap({
            receiverAccountId: ethId,
            tokenId: "ethereum/erc20/usd__coin",
            fromAccountId: usdcId,
            operationId: "",
            finalAmount: new Amount("20.5"),
            createdAt: 1,
          }),
        ],
      },
    ]);
    const [entry] = selectAccountSwapHistory(store.getState(), btcUUID);
    expect(entry).toMatchObject({
      toAccountUUID: ethUUID,
      toAssetId: "ethereum/erc20/usd__coin",
      fromAccountUUID: ethUUID,
      fromAssetId: "ethereum/erc20/usd__coin",
      finalAmount: "20.5",
      createdAt: 1,
    });
    expect(entry.operationId).toBeUndefined();
  });

  it("leaves out a swap whose sender is gone, as the legacy history does", () => {
    const { store } = setup([
      ethAccount(),
      { ...btcAccount, swapHistory: [swap({ fromAccountId: "js:2:solana:gone:" })] },
    ]);
    expect(selectAccountSwapHistory(store.getState(), btcUUID)).toEqual([]);
  });

  it("leaves out an account the accounts slice does not list, until it does", () => {
    const { store } = setup([ethAccount([swap()]), btcAccount]);
    store.dispatch(replaceKnown({ [btcId]: btcUUID }));
    expect(store.getState().swapHistory).toEqual({});
    store.dispatch(replaceKnown({ [ethId]: ethUUID }));
    expect(selectAccountSwapHistory(store.getState(), ethUUID)).toHaveLength(1);
    expect(selectAccountSwapHistory(store.getState(), ethUUID)[0].toAccountUUID).toBeUndefined();
  });

  it("follows a status update written on the legacy account", () => {
    const { store } = setup([ethAccount([swap()]), btcAccount]);
    store.dispatch(replaceAccounts([ethAccount([swap({ status: "finished" })]), btcAccount]));
    expect(selectSwapHistoryEntries(store.getState())).toMatchObject([{ status: "finished" }]);
  });

  it("does not dispatch on an update that keeps every swap history", () => {
    const history = [swap()];
    const { store, dispatch } = setup([ethAccount(history), btcAccount]);
    dispatch.mockClear();
    store.dispatch(replaceAccounts([ethAccount(history), btcAccount]));
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("leaves out a swap the entity cannot express, and reports it once", () => {
    const invalid = swap({ swapId: "" });
    const { store, onError } = setup([
      ethAccount([invalid, swap({ swapId: "swap-2" })]),
      btcAccount,
    ]);
    store.dispatch(replaceKnown({ [ethId]: ethUUID, [btcId]: btcUUID }));
    expect(selectAccountSwapHistory(store.getState(), ethUUID)).toMatchObject([
      { swapId: "swap-2" },
    ]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.anything(), invalid);
  });

  it("stops mirroring once disconnected", () => {
    const { store, disconnect } = setup([btcAccount]);
    disconnect();
    store.dispatch(replaceAccounts([ethAccount([swap()]), btcAccount]));
    expect(store.getState().swapHistory).toEqual(initialSwapHistoryState);
  });
});
