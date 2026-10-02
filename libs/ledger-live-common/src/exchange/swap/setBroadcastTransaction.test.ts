import { getEnv } from "@shared/env";
import { postSwapAccepted, postSwapCancelled } from "./index";
import { setBroadcastTransaction } from "./setBroadcastTransaction";

jest.mock("@shared/env", () => ({
  getEnv: jest.fn(),
}));

jest.mock("./index", () => ({
  postSwapAccepted: jest.fn(),
  postSwapCancelled: jest.fn(),
}));

const mockedGetEnv = jest.mocked(getEnv);
const mockedPostSwapCancelled = jest.mocked(postSwapCancelled);

describe("setBroadcastTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("includes device app versions when broadcast is disabled", () => {
    mockedGetEnv.mockReturnValue(true);

    setBroadcastTransaction({
      result: { operation: "operation-hash", swapId: "swap-id" },
      provider: "changelly",
      exchangeAppVersion: "4.4.4",
      signingAppName: "Ethereum",
      signingAppVersion: "1.15.2",
    });

    expect(mockedPostSwapCancelled).toHaveBeenCalledWith(
      expect.objectContaining({
        exchangeAppVersion: "4.4.4",
        signingAppName: "Ethereum",
        signingAppVersion: "1.15.2",
      }),
    );
    expect(postSwapAccepted).not.toHaveBeenCalled();
  });
});
