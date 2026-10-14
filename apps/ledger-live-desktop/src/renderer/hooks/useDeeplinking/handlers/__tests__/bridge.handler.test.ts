import { openModal } from "~/renderer/actions/modals";
import { bridgeHandler } from "../bridge.handler";
import { createMockContext } from "./test-utils";

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn(() => ({ type: "OPEN_MODAL" })),
}));

const mockOpenModal = jest.mocked(openModal);

describe("bridge.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("bridgeHandler", () => {
    it("opens WebSocket bridge modal", () => {
      const context = createMockContext();

      bridgeHandler(
        {
          type: "bridge",
          origin: "https://example.com",
          appName: "MyApp",
        },
        context,
      );

      expect(context.dispatch).toHaveBeenCalledWith(
        mockOpenModal("MODAL_WEBSOCKET_BRIDGE", {
          origin: "https://example.com",
          appName: "MyApp",
        }),
      );
    });

    it("handles missing origin and appName", () => {
      const context = createMockContext();

      bridgeHandler({ type: "bridge" }, context);

      expect(context.dispatch).toHaveBeenCalledWith(
        mockOpenModal("MODAL_WEBSOCKET_BRIDGE", {
          origin: undefined,
          appName: undefined,
        }),
      );
    });
  });
});
