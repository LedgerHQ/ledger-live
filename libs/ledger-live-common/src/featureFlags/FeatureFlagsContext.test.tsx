import { renderHook } from "@testing-library/react-hooks";
import { makeMockedContextValue, makeMockedFeatureFlagsProviderWrapper } from "./mock";
import { useFeatureFlags } from "./FeatureFlagsContext";

describe("useFeatureFlags hook", () => {
  it("should return the context value if it is used inside a context provider", () => {
    const mockedContextValue = makeMockedContextValue({});
    const { result } = renderHook(() => useFeatureFlags(), {
      wrapper: makeMockedFeatureFlagsProviderWrapper(mockedContextValue),
    });
    expect(result?.current).toStrictEqual(mockedContextValue);
  });
});
