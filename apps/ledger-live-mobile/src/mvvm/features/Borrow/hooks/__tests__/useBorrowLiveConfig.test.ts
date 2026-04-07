import { renderHook } from "@tests/test-renderer";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useBorrowLiveConfig } from "../useBorrowLiveConfig";

jest.mock("@ledgerhq/live-common/featureFlags/useFeature");

describe("useBorrowLiveConfig", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call useFeature with ptxBorrowLiveApp", () => {
    jest.mocked(useFeature).mockReturnValue(null);

    renderHook(() => useBorrowLiveConfig());

    expect(useFeature).toHaveBeenCalledWith("ptxBorrowLiveApp");
  });

  it("should return the feature flag value", () => {
    const config = { enabled: true, params: { manifest_id: "borrow-v2" } };
    jest.mocked(useFeature).mockReturnValue(config as ReturnType<typeof useFeature>);

    const { result } = renderHook(() => useBorrowLiveConfig());
    expect(result.current).toEqual(config);
  });

  it("should return null when feature is not configured", () => {
    jest.mocked(useFeature).mockReturnValue(null);

    const { result } = renderHook(() => useBorrowLiveConfig());
    expect(result.current).toBeNull();
  });
});
