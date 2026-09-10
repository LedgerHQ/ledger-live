import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useCardHostedManifests } from "../useCardHostedManifests";

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

const mockedManifest = jest.mocked(useLiveAppManifest);

function renderManifests(params?: Record<string, string>) {
  return renderHook(() => useCardHostedManifests(), {
    initialState: withFlagOverrides({
      lwdPayTab: { enabled: true, params: { card: true, ...params } },
    }),
  });
}

describe("useCardHostedManifests", () => {
  beforeEach(() => {
    mockedManifest.mockClear();
  });

  it("reads the manifest ids the flag overrides", () => {
    renderManifests({
      baanx_login_manifest_id: "custom-login",
      baanx_hosted_manifest_id: "custom-hosted",
    });

    expect(mockedManifest).toHaveBeenCalledWith("custom-login");
    expect(mockedManifest).toHaveBeenCalledWith("custom-hosted");
  });

  it("falls back to the registered default ids when a remote flag omits them", () => {
    // A remote or overridden flag replaces the whole params object, so `card: true` alone must not
    // leave the manifest lookups undefined.
    renderManifests();

    expect(mockedManifest).toHaveBeenCalledWith("baanx-login-url-stg");
    expect(mockedManifest).toHaveBeenCalledWith("baanx-hosted-url-stg");
  });
});
