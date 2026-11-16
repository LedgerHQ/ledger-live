import type { MockServerOverlayState } from "./types";

type MockServerOverlayStateRoot = {
  mockServerOverlay: MockServerOverlayState;
};

export const selectMockServerOverlayMode = (state: MockServerOverlayStateRoot) =>
  state.mockServerOverlay.mode;

export const selectMockServerDeviceScreenWidth = (state: MockServerOverlayStateRoot) =>
  state.mockServerOverlay.deviceScreenWidth;

export const selectIsMockServerFloatingButtonHidden = (state: MockServerOverlayStateRoot) =>
  state.mockServerOverlay.isFloatingButtonHidden;
