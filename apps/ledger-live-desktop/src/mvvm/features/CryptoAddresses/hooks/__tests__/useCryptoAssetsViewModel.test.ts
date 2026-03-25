import { renderHook, act } from "tests/testSetup";
import useCryptoAssetsViewModel from "../useCryptoAssetsViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

describe("useCryptoAssetsViewModel", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("should navigate to home when onBack is called", () => {
    const { result } = renderHook(() => useCryptoAssetsViewModel());

    act(() => {
      result.current.onBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
