import { renderHook } from "@tests/test-renderer";
import { usePerpsHandlers } from "../usePerpsHandlers";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getMigrationRequestId,
  settleMigrationRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import {
  getDepositRequestId,
  settleDepositRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/depositRequest";

jest.mock("@ledgerhq/live-common/wallet-api/Perps/server", () => ({
  handlers: jest.fn().mockReturnValue({
    "custom.perps.signActions": jest.fn(),
    "custom.perps.deposit": jest.fn(),
  }),
}));

const mockNavigate = jest.fn();
const mockRemoveFocusListener = jest.fn();
const mockAddListener = jest.fn((_event: string, _listener: () => void) => mockRemoveFocusListener);
const mockNavigation = { navigate: mockNavigate, addListener: mockAddListener };
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation,
}));

const mockOpenDrawer = jest.fn();
jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
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

  it("should navigate to PerpsSign screen when signing.execute is called", () => {
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

    expect(mockNavigate).toHaveBeenCalledWith("PerpsSign", {
      appName: "Hyperliquid",
      appOptions: undefined,
      signFactory: params.signFactory,
      onSuccess: params.onSuccess,
      onError: params.onError,
      onCancel: params.onCancel,
    });
  });

  it("should navigate to the deposit form and resolve once the deposit settles", async () => {
    const accounts = [{ id: "acc-1" }] as never[];
    const receiverAccount = { id: "receiver-1", name: "HL Account" } as never;

    renderHook(() => usePerpsHandlers(accounts));

    const depositExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["deposit.execute"];
    const request = depositExecute?.({ receiverAccount });
    settleDepositRequest(getDepositRequestId(), { swapId: "swap-1" });

    expect(mockNavigate).toHaveBeenCalledWith("PerpsDeposit", { receiverAccount });
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
      renderHook(() => usePerpsHandlers([]));
      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const request = migrationExecute?.({ legacyAccount, existingAccounts: [] });
      const [, { params }] = mockNavigate.mock.calls[0];
      return { request, params };
    };

    it("should open hypercore device selection without preselecting accounts", () => {
      startMigration().request?.catch(() => {});

      expect(mockNavigate).toHaveBeenCalledWith("DeviceSelection", {
        screen: "SelectDevice",
        params: expect.objectContaining({
          currency: expect.objectContaining({ id: "hypercore" }),
          context: "addAccounts",
          autoSelect: false,
          onDone: expect.any(Function),
        }),
      });
    });

    it("should resolve with the accounts the user confirmed on Done", async () => {
      const { request, params } = startMigration();

      params.onDone(discovered);

      await expect(request).resolves.toEqual(discovered);
    });

    it("should reject when the user comes back to Perps without Done", async () => {
      const { request } = startMigration();

      const [event, onFocus] = mockAddListener.mock.calls[0];
      expect(event).toBe("focus");
      // React Navigation hands the listener an event object.
      (onFocus as (e: unknown) => void)({ type: "focus" });

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should stay a success when the user leaves the success screen without Done", async () => {
      const { request, params } = startMigration();

      params.onAccountsAdded(discovered);
      mockAddListener.mock.calls[0][1]();

      await expect(request).resolves.toEqual(discovered);
    });

    it("should ignore a Done from an abandoned attempt", async () => {
      const { request: first, params: firstParams } = startMigration();
      const staleId = getMigrationRequestId();
      mockAddListener.mock.calls[0][1]();
      await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);

      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const second = migrationExecute?.({ legacyAccount, existingAccounts: [] });
      firstParams.onDone(discovered);
      settleMigrationRequest(getMigrationRequestId(), [{ id: "hc-2" }] as never[]);

      expect(staleId).not.toBe(getMigrationRequestId());
      await expect(second).resolves.toEqual([{ id: "hc-2" }]);
    });

    it("should reject an in-flight migration when the live app unmounts", async () => {
      const { unmount } = renderHook(() => usePerpsHandlers([]));
      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const request = migrationExecute?.({ legacyAccount, existingAccounts: [] });
      unmount();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
      expect(mockRemoveFocusListener).toHaveBeenCalled();
    });

    describe("when the wallet already has Hyperliquid accounts", () => {
      const existingAccount = { id: "hc-existing", type: "Account" } as never;

      const startWithExisting = () => {
        renderHook(() => usePerpsHandlers([]));
        const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
        const request = migrationExecute?.({ legacyAccount, existingAccounts: [existingAccount] });
        const [drawerParams] = mockOpenDrawer.mock.calls[0];
        return { request, drawerParams };
      };

      it("should offer the existing accounts before any discovery", () => {
        const { request, drawerParams } = startWithExisting();
        request?.catch(() => {});

        expect(drawerParams).toEqual(
          expect.objectContaining({
            currencies: ["hypercore"],
            areCurrenciesFiltered: true,
            enableAccountSelection: true,
            uiUseCase: "perpetuals:receive",
          }),
        );
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      it("should resolve with the existing account the user picks", async () => {
        const { request, drawerParams } = startWithExisting();

        drawerParams.onAccountSelected(existingAccount);

        await expect(request).resolves.toEqual([existingAccount]);
      });

      it("should switch to the migration discovery on Add account", async () => {
        const { request, drawerParams } = startWithExisting();

        drawerParams.onAddAccount();

        const [, { params }] = mockNavigate.mock.calls[0];
        expect(params).toEqual(expect.objectContaining({ autoSelect: false }));
        params.onDone(discovered);
        await expect(request).resolves.toEqual(discovered);
      });

      it("should reject when the user closes the selector", async () => {
        const { request, drawerParams } = startWithExisting();

        drawerParams.onCancel();

        await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
      });
    });
  });
});
