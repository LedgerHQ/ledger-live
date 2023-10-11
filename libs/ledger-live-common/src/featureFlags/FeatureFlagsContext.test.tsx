import { renderHook } from "@testing-library/react-hooks";
import { makeMockedContextValue, makeMockedFeatureFlagsProviderWrapper } from "./mock";
import { useFeatureFlags } from "./FeatureFlagsContext";

describe("useFeatureFlags hook", () => {
  it("should throw if it is used outside of the context provider", () => {
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.error?.message).toBe(
      "useFeatureFlags must be used within a FeatureFlagsProvider (React context provider)",
    );
  });

  it("should return the context value if it is used inside a context provider", () => {
    const mockedContextValue = makeMockedContextValue({});
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: makeMockedFeatureFlagsProviderWrapper(mockedContextValue),
    });
    expect(result?.current).toStrictEqual(mockedContextValue);
  });
});
