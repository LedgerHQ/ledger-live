import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useOfferSync } from "./useOfferSync";

const trustchain = {
  rootId: "rootId",
  applicationPath: "applicationPath",
  walletSyncEncryptionKey: "walletSyncEncryptionKey",
};

function stateWith(offerLedgerSync: boolean, hasTrustchain: boolean) {
  return withFlagOverrides(
    {
      deviceOnboarding: {
        enabled: true,
        params: { offerLedgerSync },
      },
    },
    (state: State) => ({
      ...state,
      trustchain: {
        ...state.trustchain,
        trustchain: hasTrustchain ? trustchain : null,
      },
    }),
  );
}

describe("useOfferSync", () => {
  it("stays off when the flag is off", () => {
    const { result } = renderHook(() => useOfferSync());

    expect(result.current).toBe(false);
  });

  it("stays off when the flag is on but sync is not offered", () => {
    const { result } = renderHook(() => useOfferSync(), {
      overrideInitialState: stateWith(false, false),
    });

    expect(result.current).toBe(false);
  });

  it("offers sync when the flag is on and the app has no trustchain", () => {
    const { result } = renderHook(() => useOfferSync(), {
      overrideInitialState: stateWith(true, false),
    });

    expect(result.current).toBe(true);
  });

  it("stays off when the app already has a trustchain", () => {
    const { result } = renderHook(() => useOfferSync(), {
      overrideInitialState: stateWith(true, true),
    });

    expect(result.current).toBe(false);
  });
});
