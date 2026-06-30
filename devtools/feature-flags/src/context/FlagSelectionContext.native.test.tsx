import type { PropsWithChildren } from "react";
import { act, renderHook } from "jest/render.native";
import { useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import type { FeatureId } from "@shared/feature-flags";
import {
  FlagSelectionProvider,
  useFlagSelectionActions,
  useFlagSelectionState,
} from "./FlagSelectionContext.native";

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
  useBottomSheetRef: jest.fn(),
}));

const flagId: FeatureId = "mockFeature";
const present = jest.fn();

beforeEach(() => {
  present.mockClear();
  jest.mocked(useBottomSheetRef).mockReturnValue({
    current: {
      present,
      dismiss: jest.fn(),
      snapToIndex: jest.fn(),
      snapToPosition: jest.fn(),
      expand: jest.fn(),
      collapse: jest.fn(),
      close: jest.fn(),
      forceClose: jest.fn(),
    },
  });
});

function wrapper({ children }: PropsWithChildren) {
  return <FlagSelectionProvider>{children}</FlagSelectionProvider>;
}

function renderContext() {
  return renderHook(() => ({ ...useFlagSelectionActions(), ...useFlagSelectionState() }), {
    wrapper,
  });
}

describe("FlagSelectionContext", () => {
  it("starts with no flag selected", () => {
    const { result } = renderContext();
    expect(result.current.selectedFlagId).toBeNull();
  });

  it("selects the flag on openFlag", () => {
    const { result } = renderContext();
    act(() => result.current.openFlag(flagId));
    expect(result.current.selectedFlagId).toBe(flagId);
  });

  it("presents the bottom sheet on openFlag", () => {
    const { result } = renderContext();
    act(() => result.current.openFlag(flagId));
    expect(present).toHaveBeenCalledTimes(1);
  });

  it("clears the selection on closeFlag", () => {
    const { result } = renderContext();
    act(() => result.current.openFlag(flagId));
    act(() => result.current.closeFlag());
    expect(result.current.selectedFlagId).toBeNull();
  });

  it("throws when actions are used outside the provider", () => {
    expect(() => renderHook(() => useFlagSelectionActions())).toThrow();
  });

  it("throws when state is used outside the provider", () => {
    expect(() => renderHook(() => useFlagSelectionState())).toThrow();
  });
});
