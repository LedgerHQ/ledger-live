import { renderHook, act } from "@testing-library/react";
import { useProdToggle } from "./useProdToggle";

const BACKENDS = {
  prod: {
    trustchainApiBaseUrl: "https://trustchain.prod.test",
    cloudSyncApiBaseUrl: "https://cloud-sync.prod.test",
  },
  staging: {
    trustchainApiBaseUrl: "https://trustchain.staging.test",
    cloudSyncApiBaseUrl: "https://cloud-sync.staging.test",
  },
};

describe("useProdToggle", () => {
  it("should start on the staging backend", () => {
    const { result } = renderHook(() => useProdToggle(BACKENDS));

    expect(result.current).toMatchObject({ useProd: false, ...BACKENDS.staging });
  });

  it("should switch to the prod backend when setUseProd(true) is called", () => {
    const { result } = renderHook(() => useProdToggle(BACKENDS));

    act(() => {
      result.current.setUseProd(true);
    });

    expect(result.current).toMatchObject({ useProd: true, ...BACKENDS.prod });
  });
});
