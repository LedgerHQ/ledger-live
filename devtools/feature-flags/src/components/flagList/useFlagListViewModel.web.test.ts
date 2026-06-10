import { renderHook, waitFor } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";
import type { FeatureFlagsToolProps } from "../../types";
import { buildOverridesExport } from "../../utils/exportOverrides";
import { saveFile } from "../../utils/saveFile";
import { readFile } from "../../utils/readFile";
import { useFlagListViewModel } from "./useFlagListViewModel.web";

jest.mock("../../utils/saveFile");
jest.mock("../../utils/readFile");

const saveFileMock = jest.mocked(saveFile);
const readFileMock = jest.mocked(readFile);

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const baseProps: FeatureFlagsToolProps = {
  resolved,
  overrides: {},
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
  importOverrides: jest.fn(),
};

const renderViewModel = (props: FeatureFlagsToolProps) =>
  renderHook(() => useFlagListViewModel(props)).result;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useFlagListViewModel", () => {
  describe("export action", () => {
    it("delivers the serialized overrides to the file system", () => {
      const overrides: PartialFeatures = { mockFeature: { enabled: true } };
      const { current } = renderViewModel({ ...baseProps, overrides });
      current.toolBarProps.actions.exportOverrides();
      const { content, filename } = buildOverridesExport(overrides);
      expect(saveFileMock).toHaveBeenCalledWith(content, filename);
    });

    it("uses the injected exportOverrides when provided", () => {
      const exportOverrides = jest.fn();
      const { current } = renderViewModel({ ...baseProps, exportOverrides });
      current.toolBarProps.actions.exportOverrides();
      expect(exportOverrides).toHaveBeenCalledTimes(1);
      expect(saveFileMock).not.toHaveBeenCalled();
    });
  });

  describe("import action", () => {
    it("applies the imported overrides", async () => {
      const importOverrides = jest.fn();
      readFileMock.mockResolvedValue(JSON.stringify({ mockFeature: { enabled: true } }));
      const { current } = renderViewModel({ ...baseProps, importOverrides });
      current.toolBarProps.actions.importOverrides();
      await waitFor(() =>
        expect(importOverrides).toHaveBeenCalledWith({ mockFeature: { enabled: true } }),
      );
    });

    it("ignores a cancelled or failed import", async () => {
      const importOverrides = jest.fn();
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      readFileMock.mockRejectedValue(new Error("cancelled"));
      const { current } = renderViewModel({ ...baseProps, importOverrides });
      current.toolBarProps.actions.importOverrides();
      await waitFor(() => expect(warnSpy).toHaveBeenCalled());
      expect(importOverrides).not.toHaveBeenCalled();
    });
  });
});
