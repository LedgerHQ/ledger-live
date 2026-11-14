import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { PerpsDepositExecutionDeps } from "@ledgerhq/live-common/wallet-api/Perps/deposit/usePerpsDepositExecution";
import { track } from "@shared/analytics";
import { renderHook } from "@tests/test-renderer";
import { usePerpsDepositExecution } from "../usePerpsDepositExecution";

const mockSharedExecution = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/deposit/usePerpsDepositExecution", () => ({
  usePerpsDepositExecution: (params: unknown, callbacks: unknown, deps: unknown) =>
    mockSharedExecution(params, callbacks, deps),
}));

jest.mock("~/hooks/deviceActions", () => ({
  useStartExchangeDeviceAction: () => "start-action",
  useTransactionDeviceAction: () => "sign-action",
  useCompleteExchangeDeviceAction: () => "complete-action",
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
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [fundedParent, receiverAccount] },
    }),
  });
  const lastCall = mockSharedExecution.mock.lastCall;
  if (!lastCall) throw new Error("usePerpsDepositExecution did not call the shared hook");
  const deps: PerpsDepositExecutionDeps = lastCall[2];
  return { ...view, deps };
}

describe("usePerpsDepositExecution (mobile)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("runs the shared deposit with the wallet's flattened accounts and the mobile device actions", () => {
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

    const updated = store.getState().accounts.active.find(({ id }) => id === receiverAccount.id);
    expect(updated?.blockHeight).toBe(42);
  });
});
