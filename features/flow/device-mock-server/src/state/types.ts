export type MockServerOverlayMode =
  | { type: "hidden" }
  | { type: "main" }
  | { type: "device"; deviceId: string };

export type MockServerOverlayState = {
  mode: MockServerOverlayMode;
  deviceScreenWidth: number;
  isFloatingButtonHidden: boolean;
};
