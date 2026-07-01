import { render, screen, userEvent } from "jest/render.native";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { FlagDisplayState } from "../../types";
import {
  useFeatureFlagsToolActions,
  useFeatureFlagsToolState,
} from "../../context/FeatureFlagsToolContext.native";
import { useFlagSelectionActions } from "../../context/FlagSelectionContext.native";
import { FlagRow } from "./FlagRow.native";

jest.mock("../../context/FeatureFlagsToolContext.native", () => ({
  useFeatureFlagsToolActions: jest.fn(),
  useFeatureFlagsToolState: jest.fn(),
}));
jest.mock("../../context/FlagSelectionContext.native", () => ({
  useFlagSelectionActions: jest.fn(),
}));

const mockedUseToolActions = jest.mocked(useFeatureFlagsToolActions);
const mockedUseToolState = jest.mocked(useFeatureFlagsToolState);
const mockedUseSelection = jest.mocked(useFlagSelectionActions);

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const makeDisplay = (overrides: Partial<FlagDisplayState> = {}): FlagDisplayState => ({
  id: "mockFeature",
  resolved: { enabled: false },
  isOverridden: false,
  ...overrides,
});

function mockTool(display: FlagDisplayState, setOverride = jest.fn()) {
  mockedUseToolState.mockReturnValue({
    resolved,
    overrides: {},
    getFlagDisplayState: () => display,
  });
  mockedUseToolActions.mockReturnValue({
    setOverride,
    setAllOverrides: jest.fn(),
    clearOverride: jest.fn(),
    clearAllOverrides: jest.fn(),
  });
  return setOverride;
}

function mockSelection(openFlag = jest.fn()) {
  mockedUseSelection.mockReturnValue({
    bottomSheetRef: { current: null },
    openFlag,
    closeFlag: jest.fn(),
  });
  return openFlag;
}

describe("FlagRow (native)", () => {
  beforeEach(() => {
    mockTool(makeDisplay());
    mockSelection();
  });

  it("shows the flag id and an Off indicator when disabled", () => {
    mockTool(makeDisplay({ resolved: { enabled: false } }));
    render(<FlagRow id="mockFeature" />);
    expect(screen.getByText("mockFeature")).toBeOnTheScreen();
    expect(screen.getByText("Off")).toBeOnTheScreen();
  });

  it("shows an On indicator when enabled", () => {
    mockTool(makeDisplay({ resolved: { enabled: true } }));
    render(<FlagRow id="mockFeature" />);
    expect(screen.getByText("On")).toBeOnTheScreen();
  });

  it("overrides the flag with the toggled value when the switch is pressed", async () => {
    const user = userEvent.setup();
    const setOverride = mockTool(makeDisplay({ resolved: { enabled: false } }));
    render(<FlagRow id="mockFeature" />);
    await user.press(screen.getByRole("switch"));
    expect(setOverride).toHaveBeenCalledWith("mockFeature", { enabled: true });
  });

  it("keeps the other resolved fields when toggling", async () => {
    const user = userEvent.setup();
    const setOverride = mockTool(
      makeDisplay({ resolved: { enabled: true, params: "value" }, isOverridden: true }),
    );
    render(<FlagRow id="mockFeature" />);
    await user.press(screen.getByRole("switch"));
    expect(setOverride).toHaveBeenCalledWith("mockFeature", { params: "value", enabled: false });
  });

  it("opens the flag when the row is pressed", async () => {
    const user = userEvent.setup();
    const openFlag = mockSelection();
    render(<FlagRow id="mockFeature" />);
    await user.press(screen.getByRole("button"));
    expect(openFlag).toHaveBeenCalledWith("mockFeature");
  });

  it("does not open the flag when the switch is pressed", async () => {
    const user = userEvent.setup();
    const openFlag = mockSelection();
    render(<FlagRow id="mockFeature" />);
    await user.press(screen.getByRole("switch"));
    expect(openFlag).not.toHaveBeenCalled();
  });
});
