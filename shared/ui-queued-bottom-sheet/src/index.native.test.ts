import * as nativeApi from "./index.native";

describe("public API barrels", () => {
  it("native barrel exposes the queue API and the native bottom sheet", () => {
    expect(nativeApi.QueuedBottomSheetsProvider).toBeDefined();
    expect(nativeApi.QueuedBottomSheet).toBeDefined();
    expect(nativeApi.useQueuedBottomSheetContext).toBeDefined();
    expect(nativeApi.IsInBottomSheetContext).toBeDefined();
    expect(nativeApi.useBottomSheetBackgroundTone).toBeDefined();
    expect(nativeApi.defaultQueuedBottomSheetAdapters).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(nativeApi, "useQueuedBottomSheet")).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(nativeApi, "useBottomSheetBackgroundToneRequests"),
    ).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(nativeApi, "useQueuedBottomSheetAdapters")).toBe(
      false,
    );
  });
});
