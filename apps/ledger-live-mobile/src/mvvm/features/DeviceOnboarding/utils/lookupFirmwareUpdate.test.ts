import { CatalogueUnreachable } from "@ledgerhq/device-onboarding";
import { getLatestFirmwareForDeviceUseCase } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { getDeviceInfoTask } from "@ledgerhq/live-common/deviceSDK/tasks/getDeviceInfo";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Observable, of } from "rxjs";
import { lookupFirmwareUpdate } from "./lookupFirmwareUpdate";

jest.mock("@ledgerhq/live-common/deviceSDK/tasks/getDeviceInfo", () => ({
  getDeviceInfoTask: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase", () => ({
  getLatestFirmwareForDeviceUseCase: jest.fn(),
}));

const mockedGetDeviceInfoTask = jest.mocked(getDeviceInfoTask);
const mockedGetLatestFirmware = jest.mocked(getLatestFirmwareForDeviceUseCase);

const deviceInfo = { version: "1.7.0" } as DeviceInfo;

const catalogue = {
  shouldFlashMCU: true,
  final: {
    id: 1,
    version: "1.8.0",
    perso: "perso",
    firmware: "firmware",
    firmware_key: "key",
    hash: "hash",
    bytes: 12,
    mcu_versions: [3],
  },
  osu: {
    id: 4,
    notes: "notes",
    perso: "osu-perso",
    firmware: "osu-firmware",
    firmware_key: "osu-key",
    hash: "osu-hash",
    next_se_firmware_final_version: 1,
  },
} as FirmwareUpdateContext;

describe("lookupFirmwareUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when the catalogue has no newer firmware", async () => {
    mockDeviceInfo();
    mockedGetLatestFirmware.mockResolvedValue(null);

    await expect(lookupFirmwareUpdate("device", null, freshSignal())).resolves.toBeNull();
    expect(mockedGetDeviceInfoTask).toHaveBeenCalledWith({
      deviceId: "device",
      deviceName: null,
    });
  });

  it("maps the catalogue firmware onto the update the machine stores", async () => {
    mockDeviceInfo();
    mockedGetLatestFirmware.mockResolvedValue(catalogue);

    await expect(lookupFirmwareUpdate("device", "Ledger Stax", freshSignal())).resolves.toEqual({
      mcuUpdateRequired: true,
      finalFirmware: {
        id: 1,
        version: "1.8.0",
        perso: "perso",
        firmware: "firmware",
        firmwareKey: "key",
        hash: "hash",
        bytes: 12,
        mcuVersions: [3],
      },
      osuFirmware: {
        id: 4,
        notes: "notes",
        perso: "osu-perso",
        firmware: "osu-firmware",
        firmwareKey: "osu-key",
        hash: "osu-hash",
        nextFinalFirmware: 1,
      },
    });
  });

  it("keeps a device read failure and does not ask the catalogue", async () => {
    const locked = new Error("locked");
    mockedGetDeviceInfoTask.mockReturnValue(
      of({ type: "error", error: locked, retrying: false }) as ReturnType<typeof getDeviceInfoTask>,
    );

    await expect(lookupFirmwareUpdate("device", "Ledger Stax", freshSignal())).rejects.toBe(locked);
    expect(mockedGetLatestFirmware).not.toHaveBeenCalled();
  });

  it("reports an unreachable catalogue", async () => {
    mockDeviceInfo();
    mockedGetLatestFirmware.mockRejectedValue(new Error("offline"));

    await expect(
      lookupFirmwareUpdate("device", "Ledger Stax", freshSignal()),
    ).rejects.toBeInstanceOf(CatalogueUnreachable);
  });

  it("unsubscribes the device read when the lookup is cancelled", async () => {
    let unsubscribed = false;
    mockedGetDeviceInfoTask.mockReturnValue(
      new Observable(() => () => {
        unsubscribed = true;
      }) as ReturnType<typeof getDeviceInfoTask>,
    );
    const controller = new AbortController();
    const pending = lookupFirmwareUpdate("device", "Ledger Stax", controller.signal);

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(unsubscribed).toBe(true);
    expect(mockedGetLatestFirmware).not.toHaveBeenCalled();
  });

  it("does not read the device when the lookup is already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      lookupFirmwareUpdate("device", "Ledger Stax", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(mockedGetDeviceInfoTask).not.toHaveBeenCalled();
  });
});

function freshSignal(): AbortSignal {
  return new AbortController().signal;
}

function mockDeviceInfo() {
  mockedGetDeviceInfoTask.mockReturnValue(
    of({ type: "data", deviceInfo }) as ReturnType<typeof getDeviceInfoTask>,
  );
}
