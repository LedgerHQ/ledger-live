import { LedgerDevices, Nano, Stax } from "@ledgerhq/lumen-ui-react/symbols";
import { DeviceModelId } from "@ledgerhq/devices";
import { renderHook } from "tests/testSetup";
import { useMyLedger } from "../useMyLedger";

const defaultSettings = {
  discreetMode: false,
  vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
  devicesModelList: [],
  anonymousUserNotifications: {},
};

describe("useMyLedger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns icon from lastSeenDevice modelId", () => {
    const { result: resultDefault } = renderHook(() => useMyLedger(), {
      initialState: { settings: { ...defaultSettings, lastSeenDevice: null } },
    });
    expect(resultDefault.current.icon).toBe(LedgerDevices);

    const { result: resultStax } = renderHook(() => useMyLedger(), {
      initialState: {
        settings: { ...defaultSettings, lastSeenDevice: { modelId: DeviceModelId.stax } },
      },
    });
    expect(resultStax.current.icon).toBe(Stax);

    const { result: resultNano } = renderHook(() => useMyLedger(), {
      initialState: {
        settings: { ...defaultSettings, lastSeenDevice: { modelId: DeviceModelId.nanoX } },
      },
    });
    expect(resultNano.current.icon).toBe(Nano);
  });
});
