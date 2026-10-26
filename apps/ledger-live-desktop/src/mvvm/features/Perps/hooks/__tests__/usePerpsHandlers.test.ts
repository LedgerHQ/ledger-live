import { act, renderHook } from "tests/testSetup";
import { usePerpsHandlers } from "../usePerpsHandlers";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { setDrawer } from "~/renderer/drawers/Provider";
import { closeDialog } from "~/renderer/reducers/modularDialog";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getDepositRequestId,
  settleDepositRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/depositRequest";

jest.mock("@ledgerhq/live-common/wallet-api/Perps/server", () => ({
  handlers: jest.fn().mockReturnValue({ "custom.perps.signActions": jest.fn() }),
}));

const mockOpenPerpsSign = jest.fn();
jest.mock("../../screens/PerpsSign/PerpsSignDialog", () => ({
  openPerpsSign: (...args: unknown[]) => mockOpenPerpsSign(...args),
}));

const mockOpenPerpsDeposit = jest.fn();
jest.mock("../../screens/PerpsDeposit/PerpsDepositDialog", () => ({
  openPerpsDeposit: (...args: unknown[]) => mockOpenPerpsDeposit(...args),
}));

const mockedPerpsHandlers = jest.mocked(perpsHandlers);

describe("usePerpsHandlers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call perps handlers with signing.execute ui hook", () => {
    const accounts = [{ id: "acc-1" }] as never[];

    renderHook(() => usePerpsHandlers(accounts));

    expect(mockedPerpsHandlers).toHaveBeenCalledWith({
      accounts,
      uiHooks: {
        "signing.execute": expect.any(Function),
        "deposit.execute": expect.any(Function),
        "migration.execute": expect.any(Function),
      },
    });
  });

  it("should call openPerpsSign with data when signing.execute is called", () => {
    const accounts = [{ id: "acc-1" }] as never[];
    renderHook(() => usePerpsHandlers(accounts));

    const signingExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["signing.execute"];
    const params = {
      appName: "Hyperliquid",
      appOptions: undefined,
      signFactory: jest.fn(),
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onCancel: jest.fn(),
    };

    signingExecute(params);

    expect(mockOpenPerpsSign).toHaveBeenCalledWith(params);
  });

  it("should open the deposit dialog and resolve once the deposit settles", async () => {
    const accounts = [{ id: "acc-1" }] as never[];
    const receiverAccount = { id: "receiver-1", name: "HL Account" } as never;

    renderHook(() => usePerpsHandlers(accounts));

    const depositExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["deposit.execute"];
    const params = { receiverAccount };

    const request = depositExecute?.(params);
    settleDepositRequest(getDepositRequestId(), { swapId: "swap-1" });

    expect(mockOpenPerpsDeposit).toHaveBeenCalledWith(params);
    await expect(request).resolves.toEqual({ swapId: "swap-1" });
  });

  it("should reject an in-flight deposit when the live app unmounts", async () => {
    const accounts = [{ id: "acc-1" }] as never[];
    const receiverAccount = { id: "receiver-1", name: "HL Account" } as never;

    const { unmount } = renderHook(() => usePerpsHandlers(accounts));

    const depositExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["deposit.execute"];
    const request = depositExecute?.({ receiverAccount });
    unmount();

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  describe("migration.execute", () => {
    const legacyAccount = { id: "legacy-1" } as never;
    const hypercoreAccount = { id: "hc-1", type: "Account" } as never;
    const AddAccountFlow = () => null;

    const startMigration = (existingAccounts: never[] = []) => {
      // Not minimal: the drawer provider tells the hook when the add account drawer closes.
      const view = renderHook(() => usePerpsHandlers([]), { minimal: false });
      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const request = migrationExecute?.({ legacyAccount, existingAccounts });
      const params = view.store.getState().modularDialog.dialogParams;
      return { ...view, request, params };
    };

    // What the selector's Add account does: swaps the dialog for the add account drawer.
    const openAddAccountFlow = (store: ReturnType<typeof startMigration>["store"]) =>
      act(() => {
        store.dispatch(closeDialog());
        setDrawer(AddAccountFlow, {});
      });

    it.each([
      ["no Hyperliquid account", []],
      ["Hyperliquid accounts", [hypercoreAccount]],
    ])("should open the hypercore account selector when the wallet has %s", (_, existing) => {
      const { request, params, store } = startMigration(existing as never[]);
      request?.catch(() => {});

      expect(store.getState().modularDialog.isOpen).toBe(true);
      expect(params).toEqual(
        expect.objectContaining({
          currencies: ["hypercore"],
          areCurrenciesFiltered: true,
          uiUseCase: "perpetuals:receive",
        }),
      );
    });

    it("should resolve with the account the user picks", async () => {
      const { request, params, store } = startMigration();

      act(() => params?.onAccountSelected?.(hypercoreAccount));

      await expect(request).resolves.toEqual([hypercoreAccount]);
      expect(store.getState().modularDialog.isOpen).toBe(false);
    });

    it("should resolve with the account added and selected through Add account", async () => {
      const { request, params, store } = startMigration();

      openAddAccountFlow(store);
      act(() => params?.onAccountSelected?.(hypercoreAccount));
      act(() => setDrawer());

      await expect(request).resolves.toEqual([hypercoreAccount]);
    });

    it("should reject when the user closes the selector", async () => {
      const { request, params } = startMigration();

      params?.onClose?.();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject when the user closes the add account drawer without selecting", async () => {
      const { request, store } = startMigration();

      openAddAccountFlow(store);
      act(() => setDrawer());

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject when the user picks a token account", async () => {
      const { request, params } = startMigration();

      act(() => params?.onAccountSelected?.({ id: "token", type: "TokenAccount" } as never));

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject an in-flight migration when the live app unmounts", async () => {
      const { request, unmount } = startMigration();

      unmount();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });
  });
});
