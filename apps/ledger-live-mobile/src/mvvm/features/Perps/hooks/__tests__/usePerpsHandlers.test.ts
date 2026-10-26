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
    const hypercoreAccount = { id: "hc-1", type: "Account" } as never;

    const startMigration = (existingAccounts: never[] = []) => {
      const view = renderHook(() => usePerpsHandlers([]));
      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const request = migrationExecute?.({ legacyAccount, existingAccounts });
      const [drawerParams] = mockOpenDrawer.mock.calls.at(-1);
      return { ...view, request, drawerParams };
    };

    it.each([
      ["no Hyperliquid account", []],
      ["Hyperliquid accounts", [hypercoreAccount]],
    ])("should open the hypercore account drawer when the wallet has %s", (_, existing) => {
      const { request, drawerParams } = startMigration(existing as never[]);
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

    it("should resolve with the account the user picks or adds", async () => {
      const { request, drawerParams } = startMigration();

      drawerParams.onAccountSelected(hypercoreAccount);

      await expect(request).resolves.toEqual([hypercoreAccount]);
    });

    it("should reject when the user closes the drawer or abandons Add account", async () => {
      const { request, drawerParams } = startMigration();

      drawerParams.onCancel();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject when the user picks a token account", async () => {
      const { request, drawerParams } = startMigration();

      drawerParams.onAccountSelected({ id: "token", type: "TokenAccount" });

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject when the user comes back to Perps without selecting", async () => {
      const { request } = startMigration();

      const [event, onFocus] = mockAddListener.mock.calls[0];
      expect(event).toBe("focus");
      // React Navigation hands the listener an event object.
      (onFocus as (e: unknown) => void)({ type: "focus" });

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should stay a success when Perps regains focus after the selection", async () => {
      const { request, drawerParams } = startMigration();

      drawerParams.onAccountSelected(hypercoreAccount);
      mockAddListener.mock.calls[0][1]();

      await expect(request).resolves.toEqual([hypercoreAccount]);
    });

    it("should ignore a selection from an abandoned attempt", async () => {
      const { request: first, drawerParams: firstParams } = startMigration();
      mockAddListener.mock.calls[0][1]();
      await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);

      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const second = migrationExecute?.({ legacyAccount, existingAccounts: [] });
      firstParams.onAccountSelected(hypercoreAccount);
      firstParams.onCancel();
      settleMigrationRequest(getMigrationRequestId(), [{ id: "hc-2" }] as never[]);

      await expect(second).resolves.toEqual([{ id: "hc-2" }]);
    });

    it("should reject an in-flight migration when the live app unmounts", async () => {
      const { request, unmount } = startMigration();

      unmount();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
      expect(mockRemoveFocusListener).toHaveBeenCalled();
    });
  });
});
