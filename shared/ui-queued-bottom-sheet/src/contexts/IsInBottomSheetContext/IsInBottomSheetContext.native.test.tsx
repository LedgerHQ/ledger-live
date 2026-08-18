import React from "react";
import { renderHook } from "@testing-library/react-native";
import { IsInBottomSheetContext, IsInBottomSheetProvider } from "./IsInBottomSheetContext";

describe("IsInBottomSheetContext", () => {
  it("defaults to isInBottomSheet false outside a provider", () => {
    const { result } = renderHook(() => React.useContext(IsInBottomSheetContext));
    expect(result.current.isInBottomSheet).toBe(false);
  });

  it("reports isInBottomSheet true inside IsInBottomSheetProvider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <IsInBottomSheetProvider>{children}</IsInBottomSheetProvider>
    );
    const { result } = renderHook(() => React.useContext(IsInBottomSheetContext), { wrapper });
    expect(result.current.isInBottomSheet).toBe(true);
  });
});
