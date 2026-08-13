import { LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/live-network/errors";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { AleoApiConfigurationResetError } from "../errors";
import { apiClient } from "../network/api";
import type { AleoAccountInfo } from "../types";
import { getAccountInfo } from "./getAccountInfo";

jest.mock("../network/api");

const mockGetRecordScannerStatus = jest.mocked(apiClient.getRecordScannerStatus);

describe("getAccountInfo", () => {
  const config = getMockedConfig("mainnet");
  const provableId = "scan-uuid-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps the scanner status to AleoAccountInfo in a single scanner call", async () => {
    mockGetRecordScannerStatus.mockResolvedValue({
      synced: true,
      percentage: 100,
      sync_start_height: 0,
      synced_up_to: 20985061,
    });

    const info = (await getAccountInfo(config, provableId)) as AleoAccountInfo;

    expect(mockGetRecordScannerStatus).toHaveBeenCalledTimes(1);
    expect(mockGetRecordScannerStatus).toHaveBeenCalledWith(config, provableId);
    expect(info).toEqual({
      type: "aleo",
      synced: true,
      percentage: 100,
      startHeight: 0,
      scannedHeight: 20985061,
    });
    // ADR-042 sketched synced as a number; the live scanner returns a boolean.
    expect(typeof info.synced).toBe("boolean");
  });

  it("maps a partially-synced status field by field", async () => {
    mockGetRecordScannerStatus.mockResolvedValue({
      synced: false,
      percentage: 42,
      sync_start_height: 100,
      synced_up_to: 5000,
    });

    const info = (await getAccountInfo(config, provableId)) as AleoAccountInfo;

    expect(info).toEqual({
      type: "aleo",
      synced: false,
      percentage: 42,
      startHeight: 100,
      scannedHeight: 5000,
    });
  });

  it("surfaces a 422 (stale/unknown uuid) as AleoApiConfigurationResetError", async () => {
    const error422 = new LedgerAPI4xx("Unprocessable Entity", {
      status: 422,
      url: undefined,
      method: "POST",
    });
    mockGetRecordScannerStatus.mockRejectedValue(error422);

    await expect(getAccountInfo(config, provableId)).rejects.toBeInstanceOf(
      AleoApiConfigurationResetError,
    );
  });

  it("propagates non-422 errors unchanged", async () => {
    const serverError = new LedgerAPI5xx("Internal Server Error");
    mockGetRecordScannerStatus.mockRejectedValue(serverError);

    await expect(getAccountInfo(config, provableId)).rejects.toBeInstanceOf(LedgerAPI5xx);
  });
});
