import { renderHook } from "@tests/test-renderer";
import { usePerpsHandlers } from "../usePerpsHandlers";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getDepositRequestId,
  settleDepositRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";

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
    const hypercoreAccount = { id: "hc-1", type: "Account" } as never;

    const startMigration = () => {
      const view = renderHook(() => usePerpsHandlers([]));
      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const request = migrationExecute?.();
      const [navigator, { params: flowParams }] = mockNavigate.mock.calls.at(-1);
      return { ...view, migrationExecute, request, navigator, flowParams };
    };

    it("should open the inline Hyperliquid add account flow", () => {
      const { request, navigator, flowParams } = startMigration();
      request?.catch(() => {});

      expect(navigator).toBe("DeviceSelection");
      expect(flowParams).toEqual(
        expect.objectContaining({
          currency: expect.objectContaining({ id: "hypercore" }),
          context: "addAccounts",
          inline: true,
          navigationDepth: 2,
        }),
      );
    });

    it("should resolve with every account the user added", async () => {
      const { request, flowParams } = startMigration();
      const otherAccount = { id: "hc-2", type: "Account" };

      flowParams.onSuccess({ scannedAccounts: [], selected: [hypercoreAccount, otherAccount] });

      await expect(request).resolves.toEqual([hypercoreAccount, otherAccount]);
    });

    it("should reject when the user closes the add account flow", async () => {
      const { request, flowParams } = startMigration();

      flowParams.onCloseNavigation();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject when the user comes back to Perps without adding an account", async () => {
      const { request } = startMigration();

      const [event, onFocus] = mockAddListener.mock.calls[0];
      expect(event).toBe("focus");
      // React Navigation hands the listener an event object.
      (onFocus as (e: unknown) => void)({ type: "focus" });

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should stay a success when Perps regains focus after the accounts are added", async () => {
      const { request, flowParams } = startMigration();

      flowParams.onSuccess({ scannedAccounts: [], selected: [hypercoreAccount] });
      mockAddListener.mock.calls[0][1]();

      await expect(request).resolves.toEqual([hypercoreAccount]);
    });

    it("should ignore callbacks from an abandoned attempt", async () => {
      const { request: first, flowParams: firstParams, migrationExecute } = startMigration();
      mockAddListener.mock.calls[0][1]();
      await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);

      const second = migrationExecute?.();
      const [, { params: secondParams }] = mockNavigate.mock.calls.at(-1);
      firstParams.onSuccess({ scannedAccounts: [], selected: [hypercoreAccount] });
      firstParams.onCloseNavigation();
      secondParams.onSuccess({ scannedAccounts: [], selected: [{ id: "hc-2" }] });

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
