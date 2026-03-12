import { act, renderHook } from "tests/testSetup";
import { useNavigate } from "react-router";
import useCryptosViewModel from "../hooks/useCryptosViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

describe("useCryptosViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return navigateToDashboard that navigates to /", () => {
    const navigate = jest.fn();
    mockedUseNavigate.mockReturnValue(navigate);

    const { result } = renderHook(() => useCryptosViewModel());

    expect(result.current.navigateToDashboard).toBeDefined();

    act(() => {
      result.current.navigateToDashboard();
    });

    expect(navigate).toHaveBeenCalledWith("/");
  });
});
