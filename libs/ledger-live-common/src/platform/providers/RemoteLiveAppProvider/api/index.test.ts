import { getEnv } from "@shared/env";
import api from "./index";
import type { LiveAppManifest } from "../../../types";

jest.mock("@ledgerhq/live-network/network", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@shared/env", () => ({
  getEnv: jest.fn(() => false),
}));

const mockGetEnv = jest.mocked(getEnv);
const network = jest.requireMock("@ledgerhq/live-network/network").default;

const manifests = [{ id: "buy-sell-ui" }] as LiveAppManifest[];

describe("RemoteLiveAppProvider API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockImplementation(() => false);
  });

  it("returns the manifests when the catalog call succeeds", async () => {
    network.mockResolvedValueOnce({ data: manifests });

    await expect(api.fetchLiveAppManifests("https://catalog.example.com")).resolves.toEqual(
      manifests,
    );
  });

  // Regression: the catalog fetch used to swallow network failures and resolve
  // to `[]`. Callers then could not tell "catalog is empty" from "catalog never
  // loaded", so a transient failure looked like a successful empty catalog.
  it("rejects instead of resolving to an empty list when the network call fails", async () => {
    const networkError = new Error("Network Error");
    network.mockRejectedValueOnce(networkError);

    await expect(api.fetchLiveAppManifests("https://catalog.example.com")).rejects.toThrow(
      "Network Error",
    );
  });

  it("rejects when the response payload is not an array", async () => {
    network.mockResolvedValueOnce({ data: { nope: true } });

    await expect(api.fetchLiveAppManifests("https://catalog.example.com")).rejects.toThrow(
      "Response is not an Array",
    );
  });
});
