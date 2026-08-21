import { renderHook } from "@tests/test-renderer";
import { usePerpsHandlers } from "../usePerpsHandlers";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";

jest.mock("@ledgerhq/live-common/wallet-api/Perps/server", () => ({
  handlers: jest.fn().mockReturnValue({
    "custom.perps.signActions": jest.fn(),
    "custom.perps.deposit": jest.fn(),
  }),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
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

  it("should navigate to the deposit amount form when deposit.execute is called", () => {
    const accounts = [{ id: "acc-1" }] as never[];
    const receiverAccount = { id: "receiver-1", name: "HL Account" } as never;

    renderHook(() => usePerpsHandlers(accounts));

    const depositExecute = mockedPerpsHandlers.mock.calls[0][0].uiHooks["deposit.execute"];
    depositExecute?.({ receiverAccount });

    expect(mockNavigate).toHaveBeenCalledWith("PerpsDeposit", { receiverAccount });
  });
});
