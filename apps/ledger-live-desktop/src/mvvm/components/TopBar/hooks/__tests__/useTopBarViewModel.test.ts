import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook } from "tests/testSetup";
import useTopBarViewModel from "../useTopBarViewModel";
import * as useActivityIndicatorModule from "../useActivityIndicator";
import * as useDiscreetModeModule from "../useDiscreetMode";

jest.mock("../useActivityIndicator");
jest.mock("../useDiscreetMode");

const mockUseActivityIndicator = jest.mocked(useActivityIndicatorModule.useActivityIndicator);
const mockUseDiscreetMode = jest.mocked(useDiscreetModeModule.useDiscreetMode);

describe("useTopBarViewModel", () => {
  const mockHandleSync = jest.fn();
  const mockHandleDiscreet = jest.fn();
  const mockDiscreetIcon = {} as ReturnType<typeof mockUseDiscreetMode>["discreetIcon"];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDiscreetMode.mockReturnValue({
      handleDiscreet: mockHandleDiscreet,
      discreetIcon: mockDiscreetIcon,
    });
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: true,
      handleSync: mockHandleSync,
      isDisabled: false,
      isRotating: false,
      isError: false,
      tooltip: "Refresh",
      icon: Refresh,
    });
  });

  it("returns topBarActionsList with synchronize action when hasAccounts is true", () => {
    const { result } = renderHook(() => useTopBarViewModel());

    expect(result.current.topBarActionsList).toBeDefined();
    const syncAction = result.current.topBarActionsList.find(a => a.label === "synchronize");
    expect(syncAction).toBeDefined();
    expect(syncAction?.tooltip).toBe("Refresh");
    expect(syncAction?.isInteractive).toBe(true);
    expect(syncAction?.onClick).toBe(mockHandleSync);
    expect(syncAction?.icon).toBeDefined();
  });

  it("does not include synchronize action when hasAccounts is false", () => {
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: false,
      handleSync: mockHandleSync,
      isDisabled: false,
      isRotating: false,
      isError: false,
      tooltip: "Refresh",
      icon: Refresh,
    });

    const { result } = renderHook(() => useTopBarViewModel());

    const syncAction = result.current.topBarActionsList.find(a => a.label === "synchronize");
    expect(syncAction).toBeUndefined();
  });

  it("always includes discreet action with handleDiscreet and tooltip from translation", () => {
    const { result } = renderHook(() => useTopBarViewModel());

    const discreetAction = result.current.topBarActionsList.find(a => a.label === "discreet");
    expect(discreetAction).toBeDefined();
    expect(discreetAction?.onClick).toBe(mockHandleDiscreet);
    expect(discreetAction?.isInteractive).toBe(true);
  });

  it("passes isDisabled from useActivityIndicator as isInteractive false on sync action", () => {
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: true,
      handleSync: mockHandleSync,
      isDisabled: true,
      isRotating: true,
      isError: true,
      tooltip: "Error",
      icon: Refresh,
    });

    const { result } = renderHook(() => useTopBarViewModel());

    const syncAction = result.current.topBarActionsList.find(a => a.label === "synchronize");
    expect(syncAction).toBeDefined();
    expect(syncAction?.isInteractive).toBe(false);
    expect(syncAction?.tooltip).toBe("Error");
  });
});
