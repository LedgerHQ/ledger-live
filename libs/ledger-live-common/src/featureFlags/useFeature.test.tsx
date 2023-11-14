import { renderHook } from "@testing-library/react-hooks";
import useFeature from "./useFeature";
import { makeMockedFeatureFlagsProviderWrapper, makeMockedContextValue } from "./mock";

describe("useFeature hook", () => {
  it("should return null if a flag is not defined remotely", () => {
    const mockedFeatures = {};
    const { result } = renderHook(() => useFeature("mockFeature"), {
      wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
    });
    expect(result.current).toBeNull();
  });

  it("should return the feature flag value if the feature flag is defined", () => {
    const mockedFeatures = {
      mockFeature: { enabled: true, params: { blabla: "hello" } },
    };
    const { result } = renderHook(() => useFeature("mockFeature"), {
      wrapper: makeMockedFeatureFlagsProviderWrapper(makeMockedContextValue(mockedFeatures)),
    });
    expect(result.current).toBe(mockedFeatures.mockFeature);
  });
});
