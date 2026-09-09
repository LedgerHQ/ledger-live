// `jest` is deliberately not imported from @jest/globals: that disables
// jest.mock hoisting, and "electron" would resolve before the mock registers.
import { beforeEach, describe, expect, it } from "@jest/globals";
import { ledgerUSBVendorId } from "@ledgerhq/devices";

const session = {
  on: jest.fn(),
  setDevicePermissionHandler: jest.fn(),
};

const mainWindowContents = {
  session,
  on: jest.fn(),
  setUserAgent: jest.fn(),
  getUserAgent: jest.fn(() => "UA"),
};

jest.mock("electron", () => ({
  BrowserWindow: jest.fn(() => ({
    webContents: mainWindowContents,
    on: jest.fn(),
    setBounds: jest.fn(),
  })),
  screen: {
    getPrimaryDisplay: jest.fn(() => ({ bounds: { x: 0, y: 0, width: 1920, height: 1080 } })),
  },
  app: { dirname: "", getLocale: jest.fn(() => "en"), getSystemLocale: jest.fn(() => "en") },
  webContents: { fromFrame: jest.fn() },
}));

jest.mock("./webviewHandlers", () => ({ closeTrackedWebviewDevTools: jest.fn() }));

type HidCallback = (deviceId?: string | null) => void;
type SelectHidListener = (
  event: { preventDefault: () => void },
  details: {
    frame?: unknown;
    deviceList: Array<{ deviceId: string; vendorId: number }>;
  },
  callback: HidCallback,
) => void;

const ledgerDevice = { deviceId: "ledger-1", vendorId: ledgerUSBVendorId };
const otherDevice = { deviceId: "mouse-1", vendorId: 0x1234 };

const hostContents = { getType: jest.fn(() => "window") };
const guestContents = { getType: jest.fn(() => "webview") };

/** Builds the window so the handlers register, then hands them back. */
const setup = () => {
  let selectHidDevice: SelectHidListener | undefined;
  let devicePermissionHandler:
    | ((details: { deviceType: string; device: { vendorId?: number } }) => boolean)
    | undefined;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./window-lifecycle").createEarlyMainWindow();
  });

  for (const [event, listener] of session.on.mock.calls) {
    if (event === "select-hid-device") selectHidDevice = listener as SelectHidListener;
  }
  devicePermissionHandler = session.setDevicePermissionHandler.mock.calls[0]?.[0];

  return { selectHidDevice: selectHidDevice!, devicePermissionHandler: devicePermissionHandler! };
};

const request = (
  listener: SelectHidListener,
  deviceList: Array<{ deviceId: string; vendorId: number }>,
  frame: unknown = {},
) => {
  const callback = jest.fn();
  listener({ preventDefault: jest.fn() }, { frame, deviceList }, callback);
  return callback;
};

describe("select-hid-device (DONJON-1404)", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webContents } = require("electron");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(webContents.fromFrame).mockReturnValue(hostContents);
  });

  it("selects the first Ledger device for the host renderer", () => {
    const { selectHidDevice } = setup();

    expect(request(selectHidDevice, [otherDevice, ledgerDevice])).toHaveBeenCalledWith("ledger-1");
  });

  it("cancels instead of hanging when no Ledger device is present", () => {
    // Nothing listens to `hid-device-added`, so an unanswered pick would leave
    // `navigator.hid.requestDevice()` pending forever.
    const { selectHidDevice } = setup();

    expect(request(selectHidDevice, [otherDevice])).toHaveBeenCalledWith(null);
  });

  it("never selects a device for a <webview> guest", () => {
    jest.mocked(webContents.fromFrame).mockReturnValue(guestContents);
    const { selectHidDevice } = setup();

    expect(request(selectHidDevice, [ledgerDevice])).toHaveBeenCalledWith(null);
  });

  it("denies when the requesting frame cannot be resolved", () => {
    jest.mocked(webContents.fromFrame).mockReturnValue(undefined);
    const { selectHidDevice } = setup();

    expect(request(selectHidDevice, [ledgerDevice])).toHaveBeenCalledWith(null);
  });

  it("denies when the request carries no frame at all", () => {
    const { selectHidDevice } = setup();

    expect(request(selectHidDevice, [ledgerDevice], null)).toHaveBeenCalledWith(null);
  });

  it("denies rather than throwing when the frame was already disposed", () => {
    // `fromFrame` raises on a stale WebFrameMain; escaping the listener would
    // leave the callback uncalled.
    jest.mocked(webContents.fromFrame).mockImplementation(() => {
      throw new Error("frame destroyed");
    });
    const { selectHidDevice } = setup();

    expect(() => request(selectHidDevice, [ledgerDevice])).not.toThrow();
    expect(request(selectHidDevice, [ledgerDevice])).toHaveBeenCalledWith(null);
  });
});

describe("setDevicePermissionHandler (DONJON-1404)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("grants a Ledger HID device", () => {
    const { devicePermissionHandler } = setup();

    expect(
      devicePermissionHandler({ deviceType: "hid", device: { vendorId: ledgerUSBVendorId } }),
    ).toBe(true);
  });

  it("refuses a HID device from another vendor", () => {
    const { devicePermissionHandler } = setup();

    expect(devicePermissionHandler({ deviceType: "hid", device: { vendorId: 0x1234 } })).toBe(
      false,
    );
  });

  it.each(["usb", "serial"])("refuses the %s device type outright", deviceType => {
    const { devicePermissionHandler } = setup();

    expect(devicePermissionHandler({ deviceType, device: { vendorId: ledgerUSBVendorId } })).toBe(
      false,
    );
  });
});
