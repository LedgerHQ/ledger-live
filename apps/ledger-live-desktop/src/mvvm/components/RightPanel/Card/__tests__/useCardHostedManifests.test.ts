import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { renderHook } from "tests/testSetup";
import { useCardHostedManifests } from "../useCardHostedManifests";

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

const mockedManifest = jest.mocked(useLiveAppManifest);

describe("useCardHostedManifests", () => {
  beforeEach(() => {
    mockedManifest.mockClear();
  });

  afterEach(() => {
    delete process.env.CARD_BAANX_LOGIN_MANIFEST_ID;
    delete process.env.CARD_BAANX_HOSTED_MANIFEST_ID;
  });

  it("reads the manifest ids the env carries", () => {
    process.env.CARD_BAANX_LOGIN_MANIFEST_ID = "custom-login";
    process.env.CARD_BAANX_HOSTED_MANIFEST_ID = "custom-hosted";

    renderHook(() => useCardHostedManifests());

    expect(mockedManifest).toHaveBeenCalledWith("custom-login");
    expect(mockedManifest).toHaveBeenCalledWith("custom-hosted");
  });

  it("falls back to the staging ids when the env carries none", () => {
    renderHook(() => useCardHostedManifests());

    expect(mockedManifest).toHaveBeenCalledWith("baanx-login-url-stg");
    expect(mockedManifest).toHaveBeenCalledWith("baanx-hosted-url-stg");
  });
});
