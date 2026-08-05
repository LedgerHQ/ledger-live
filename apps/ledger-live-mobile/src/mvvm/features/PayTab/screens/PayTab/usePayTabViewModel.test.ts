import { Linking } from "react-native";
import { renderHook } from "@tests/test-renderer";
import { usePayTabViewModel } from "./usePayTabViewModel";

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 24 }),
}));

describe("usePayTabViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should expose the navigation bar offset", () => {
    const { result } = renderHook(() => usePayTabViewModel());

    expect(result.current.top).toBe(24);
  });

  it("should open the hosted login URL", async () => {
    const { result } = renderHook(() => usePayTabViewModel());

    await result.current.openHostedLogin("https://card.example.com/login");

    expect(Linking.openURL).toHaveBeenCalledWith("https://card.example.com/login");
  });
});
