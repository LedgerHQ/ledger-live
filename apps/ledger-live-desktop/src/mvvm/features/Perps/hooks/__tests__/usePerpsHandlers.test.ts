import { renderHook } from "tests/testSetup";
import { usePerpsHandlers } from "../usePerpsHandlers";
import { handlers as perpsHandlers } from "@ledgerhq/live-common/wallet-api/Perps/server";

jest.mock("@ledgerhq/live-common/wallet-api/Perps/server", () => ({
  handlers: jest.fn().mockReturnValue({ "custom.perps.signActions": jest.fn() }),
}));

const mockOpenPerpsSign = jest.fn();
jest.mock("../../screens/PerpsSign/PerpsSignDialog", () => ({
  openPerpsSign: (...args: unknown[]) => mockOpenPerpsSign(...args),
}));

const mockedPerpsHandlers = jest.mocked(perpsHandlers);

describe("usePerpsHandlers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call perps handlers with signing.execute ui hook", () => {
    const accounts = [{ id: "acc-1" }] as never[];

    renderHook(() => usePerpsHandlers(accounts));

    expect(mockedPerpsHandlers).toHaveBeenCalledWith({
      accounts,
      uiHooks: { "signing.execute": expect.any(Function) },
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
});
