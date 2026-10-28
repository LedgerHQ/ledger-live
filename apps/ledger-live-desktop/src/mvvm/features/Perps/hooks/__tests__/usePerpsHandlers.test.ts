import { act, renderHook } from "tests/testSetup";
import { usePerpsHandlers } from "../usePerpsHandlers";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { setDrawer } from "~/renderer/drawers/Provider";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  getDepositRequestId,
  settleDepositRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import {
  getWithdrawRequestId,
  settleWithdrawRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/withdraw/request";

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

const mockOpenAddAccountFlow = jest.fn();
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({ openAddAccountFlow: mockOpenAddAccountFlow }),
}));
const mockOpenPerpsWithdraw = jest.fn();
jest.mock("../../screens/PerpsWithdraw/PerpsWithdrawDialog", () => ({
  openPerpsWithdraw: (...args: unknown[]) => mockOpenPerpsWithdraw(...args),
}));

const mockedPerpsHandlers = jest.mocked(perpsHandlers);

const AddAccountFlow = () => null;

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
        "withdraw.execute": expect.any(Function),
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

  it("should open the withdraw dialog and resolve once the withdrawal settles", async () => {
    const accounts = [{ id: "acc-1" }] as never[];
    const params = { sourceAccount: { id: "hl-1" } } as never;

    renderHook(() => usePerpsHandlers(accounts));

    const withdrawExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["withdraw.execute"];
    const request = withdrawExecute?.(params);
    settleWithdrawRequest(getWithdrawRequestId(), { swapId: "swap-1" });

    expect(mockOpenPerpsWithdraw).toHaveBeenCalledWith(params);
    await expect(request).resolves.toEqual({ swapId: "swap-1" });
  });

  it("should reject an in-flight withdrawal when the live app unmounts", async () => {
    const accounts = [{ id: "acc-1" }] as never[];
    const params = { sourceAccount: { id: "hl-1" } } as never;

    const { unmount } = renderHook(() => usePerpsHandlers(accounts));

    const withdrawExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["withdraw.execute"];
    const request = withdrawExecute?.(params);
    unmount();

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  describe("migration.execute", () => {
    const hypercoreAccount = { id: "hc-1", type: "Account" } as never;

    const startMigration = (walletAccounts: never[] = []) => {
      // Not minimal: the drawer provider tells the hook when the add account drawer closes.
      const view = renderHook(() => usePerpsHandlers([]), {
        minimal: false,
        initialState: { accounts: walletAccounts },
      });
      const migrationExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["migration.execute"];
      const request = migrationExecute?.();
      const [currency, onAccountSelected] = mockOpenAddAccountFlow.mock.calls.at(-1);
      return { ...view, request, currency, onAccountSelected };
    };

    // What openAddAccountFlow does: opens the add account drawer.
    const openAddAccountDrawer = () => act(() => setDrawer(AddAccountFlow, {}));

    it("should open the add account flow for Hyperliquid", () => {
      const { request, currency } = startMigration();
      request?.catch(() => {});

      expect(currency).toEqual(expect.objectContaining({ id: "hypercore" }));
    });

    it("should resolve with the account the user continues with", async () => {
      const { request, onAccountSelected } = startMigration();

      openAddAccountDrawer();
      act(() => onAccountSelected(hypercoreAccount));

      await expect(request).resolves.toEqual([hypercoreAccount]);
    });

    it("should hand the wallet accounts back too, in case the user continued with another one", async () => {
      const addedAtLegacyAddress = genAccount("hc-0", {
        currency: getCryptoCurrencyById("hypercore"),
      }) as never;
      const { request, onAccountSelected } = startMigration([addedAtLegacyAddress]);

      act(() => onAccountSelected(hypercoreAccount));

      await expect(request).resolves.toEqual([hypercoreAccount, addedAtLegacyAddress]);
    });

    it("should reject when the user closes the add account drawer without an account", async () => {
      const { request } = startMigration();

      openAddAccountDrawer();
      act(() => setDrawer());

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject when the flow hands back a token account", async () => {
      const { request, onAccountSelected } = startMigration();

      act(() => onAccountSelected({ id: "token", type: "TokenAccount" }));

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject an in-flight migration when the live app unmounts", async () => {
      const { request, unmount } = startMigration();

      unmount();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });
  });
});
