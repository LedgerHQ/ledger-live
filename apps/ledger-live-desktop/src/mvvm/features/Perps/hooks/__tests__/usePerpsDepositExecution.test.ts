import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { PerpsDepositExecutionDeps } from "@ledgerhq/live-common/wallet-api/Perps/deposit/usePerpsDepositExecution";
import { track } from "@shared/analytics";
import { renderHook } from "tests/testSetup";
import { usePerpsDepositExecution } from "../usePerpsDepositExecution";

const mockSharedExecution = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/deposit/usePerpsDepositExecution", () => ({
  usePerpsDepositExecution: (params: unknown, callbacks: unknown, deps: unknown) =>
    mockSharedExecution(params, callbacks, deps),
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  useStartExchangeAction: () => "start-action",
  useTransactionAction: () => "sign-action",
}));

jest.mock("@ledgerhq/live-common/hw/actions/completeExchange", () => ({
  createAction: () => "complete-action",
}));

const ethereum = getCryptoCurrencyById("ethereum");
const parent = genAccount("funding-parent", { currency: ethereum, operationsSize: 0 });
const tokenAccount = genTokenAccount(0, parent, usdcToken);
const fundedParent = { ...parent, subAccounts: [tokenAccount] };
const receiverAccount = genAccount("receiver-1", { currency: ethereum, operationsSize: 0 });

const params = {
  depositAccount: tokenAccount,
  receiverAccount,
  amountSent: "20",
  amountTo: "19.75",
  quoteId: "quote-1",
};
const callbacks = { onDone: jest.fn(), onRefused: jest.fn(), onReturnToForm: jest.fn() };

function renderExecution() {
  const view = renderHook(() => usePerpsDepositExecution(params, callbacks), {
    initialState: { accounts: [fundedParent, receiverAccount] },
  });
  const deps: PerpsDepositExecutionDeps = mockSharedExecution.mock.lastCall[2];
  return { ...view, deps };
}

describe("usePerpsDepositExecution (desktop)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("runs the shared deposit with the wallet's flattened accounts and the desktop device actions", () => {
    const { deps } = renderExecution();

    expect(mockSharedExecution).toHaveBeenCalledWith(params, callbacks, expect.anything());
    expect(deps.accounts.map(({ id }) => id)).toEqual(
      expect.arrayContaining([fundedParent.id, tokenAccount.id, receiverAccount.id]),
    );
    expect(deps.deviceActions).toEqual({
      start: "start-action",
      confirm: "complete-action",
      sign: "sign-action",
    });
    expect(deps.track).toBe(track);
  });

  it("writes the swap's pending operation to the store", () => {
    const { deps, store } = renderExecution();

    deps.updateAccount(receiverAccount.id, account => ({ ...account, blockHeight: 42 }));

    const updated = store.getState().accounts.find(({ id }) => id === receiverAccount.id);
    expect(updated?.blockHeight).toBe(42);
  });
});
