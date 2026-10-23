import { renderHook } from "tests/testSetup";
import { usePerpsHandlers } from "../usePerpsHandlers";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
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

const mockSetDrawer = jest.fn();
jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: (...args: unknown[]) => mockSetDrawer(...args),
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
    const discovered = [{ id: "hc-1" }] as never[];

    const startMigration = () => {
      const view = renderHook(() => usePerpsHandlers([]));
      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const request = migrationExecute?.({ legacyAccount, existingAccounts: [] });
      const [, props, options] = mockSetDrawer.mock.calls[0];
      return { ...view, request, props, options };
    };

    it("should open the add-account drawer for hypercore without preselecting accounts", () => {
      const { request } = startMigration();
      request?.catch(() => {});

      expect(mockSetDrawer).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          currency: getCryptoCurrencyById("hypercore"),
          autoSelect: false,
          onDone: expect.any(Function),
        }),
        expect.objectContaining({ onRequestClose: expect.any(Function) }),
      );
    });

    it("should resolve with the accounts the user confirmed on Done", async () => {
      const { request, props } = startMigration();

      props.onDone(discovered);

      await expect(request).resolves.toEqual(discovered);
    });

    it("should resolve as soon as the accounts are added", async () => {
      const { request, props } = startMigration();

      props.onAccountsAdded(discovered);

      await expect(request).resolves.toEqual(discovered);
    });

    it("should bind the drawer to the request and close it on X", () => {
      const { request, props, options } = startMigration();
      request?.catch(() => {});
      mockSetDrawer.mockClear();

      options.onRequestClose();

      expect(props.requestId).toEqual(expect.any(String));
      expect(mockSetDrawer).toHaveBeenCalledWith();
    });

    it("should reject an in-flight migration when the live app unmounts", async () => {
      const { request, unmount } = startMigration();

      unmount();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    describe("when the wallet already has Hyperliquid accounts", () => {
      const existingAccount = { id: "hc-existing", type: "Account" } as never;

      const startWithExisting = () => {
        const view = renderHook(() => usePerpsHandlers([]));
        const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
        const request = migrationExecute?.({ legacyAccount, existingAccounts: [existingAccount] });
        const params = view.store.getState().modularDialog.dialogParams;
        return { ...view, request, params };
      };

      it("should offer the existing accounts before any discovery", () => {
        const { request, params, store } = startWithExisting();
        request?.catch(() => {});

        expect(store.getState().modularDialog.isOpen).toBe(true);
        expect(params).toEqual(
          expect.objectContaining({
            currencies: ["hypercore"],
            areCurrenciesFiltered: true,
            uiUseCase: "perpetuals:receive",
          }),
        );
        expect(mockSetDrawer).not.toHaveBeenCalled();
      });

      it("should resolve with the existing account the user picks", async () => {
        const { request, params, store } = startWithExisting();

        params?.onAccountSelected?.(existingAccount);

        await expect(request).resolves.toEqual([existingAccount]);
        expect(store.getState().modularDialog.isOpen).toBe(false);
      });

      it("should switch to the migration discovery on Add account", async () => {
        const { request, params, store } = startWithExisting();

        params?.onAddAccount?.();

        expect(store.getState().modularDialog.isOpen).toBe(false);
        const [, props] = mockSetDrawer.mock.calls[0];
        expect(props).toEqual(expect.objectContaining({ autoSelect: false }));
        props.onDone(discovered);
        await expect(request).resolves.toEqual(discovered);
      });

      it("should reject when the user closes the selector", async () => {
        const { request, params } = startWithExisting();

        params?.onClose?.();

        await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
      });
    });
  });
});
