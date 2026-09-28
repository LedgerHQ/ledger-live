import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { getEnvDefault, setEnv } from "@shared/env";
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
    setEnv("CARD_BAANX_LOGIN_MANIFEST_ID", getEnvDefault("CARD_BAANX_LOGIN_MANIFEST_ID"));
    setEnv("CARD_BAANX_HOSTED_MANIFEST_ID", getEnvDefault("CARD_BAANX_HOSTED_MANIFEST_ID"));
  });

  it("reads the manifest ids the env carries", () => {
    setEnv("CARD_BAANX_LOGIN_MANIFEST_ID", "custom-login");
    setEnv("CARD_BAANX_HOSTED_MANIFEST_ID", "custom-hosted");

    renderHook(() => useCardHostedManifests());

    expect(mockedManifest).toHaveBeenCalledWith("custom-login");
    expect(mockedManifest).toHaveBeenCalledWith("custom-hosted");
  });

  it("falls back to the registered default ids", () => {
    renderHook(() => useCardHostedManifests());

    expect(mockedManifest).toHaveBeenCalledWith("baanx-login-url");
    expect(mockedManifest).toHaveBeenCalledWith("baanx-hosted-url");
  });
});
