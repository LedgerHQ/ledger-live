import { renderHook, waitFor } from "jest/render.native";
import { FEATURE_FLAGS_INITIAL_STATE, type PartialFeatures } from "@shared/feature-flags";
import {
  useFeatureFlagsToolActions,
  type FeatureFlagsToolContextActions,
  useFeatureFlagsToolState,
  type FeatureFlagsToolContextState,
} from "../../context/FeatureFlagsToolContext.native";
import { buildOverridesExport } from "../../utils/exportOverrides";
import { parseOverridesImport } from "../../utils/importOverrides";
import { saveFile } from "../../utils/saveFile.native";
import { readFile } from "../../utils/readFile.native";
import { useFlagMenuViewModel } from "./useFlagMenuViewModel.native";

jest.mock("../../context/FeatureFlagsToolContext.native", () => ({
  useFeatureFlagsToolActions: jest.fn(),
  useFeatureFlagsToolState: jest.fn(),
}));
jest.mock("../../utils/exportOverrides", () => ({ buildOverridesExport: jest.fn() }));
jest.mock("../../utils/importOverrides", () => ({ parseOverridesImport: jest.fn() }));
jest.mock("../../utils/saveFile.native", () => ({ saveFile: jest.fn() }));
jest.mock("../../utils/readFile.native", () => ({ readFile: jest.fn() }));

const mockedUseToolActions = jest.mocked(useFeatureFlagsToolActions);
const mockedUseToolState = jest.mocked(useFeatureFlagsToolState);
const mockedBuildExport = jest.mocked(buildOverridesExport);
const mockedParseImport = jest.mocked(parseOverridesImport);
const mockedSaveFile = jest.mocked(saveFile);
const mockedReadFile = jest.mocked(readFile);

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

function mockTool(
  overrides: Partial<FeatureFlagsToolContextState & FeatureFlagsToolContextActions> = {},
) {
  mockedUseToolState.mockReturnValue({
    overrides: {},
    resolved,
    getFlagDisplayState: jest.fn(),
    ...overrides,
  });
  mockedUseToolActions.mockReturnValue({
    setOverride: jest.fn(),
    setAllOverrides: jest.fn(),
    clearOverride: jest.fn(),
    clearAllOverrides: jest.fn(),
    ...overrides,
  });
}

describe("useFlagMenuViewModel", () => {
  beforeEach(() => mockTool());

  it("exports the current overrides to a file", () => {
    const overrides: PartialFeatures = { mockFeature: { enabled: true } };
    mockTool({ overrides });
    mockedBuildExport.mockReturnValue({ content: "CONTENT", filename: "flags.json" });
    mockedSaveFile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFlagMenuViewModel());
    result.current.onExport();

    expect(mockedBuildExport).toHaveBeenCalledWith(overrides);
    expect(mockedSaveFile).toHaveBeenCalledWith("CONTENT", "flags.json");
  });

  it("applies the imported overrides", async () => {
    const imported: PartialFeatures = { mockFeature: { enabled: false } };
    const setAllOverrides = jest.fn();
    mockTool({ setAllOverrides });
    mockedReadFile.mockResolvedValue("RAW");
    mockedParseImport.mockReturnValue({ overrides: imported, warnings: [] });

    const { result } = renderHook(() => useFlagMenuViewModel());
    result.current.onImport();

    await waitFor(() => expect(setAllOverrides).toHaveBeenCalledWith(imported));
  });

  it("clears every override on reset", () => {
    const clearAllOverrides = jest.fn();
    mockTool({ clearAllOverrides });

    const { result } = renderHook(() => useFlagMenuViewModel());
    result.current.onReset();

    expect(clearAllOverrides).toHaveBeenCalledTimes(1);
  });
});
