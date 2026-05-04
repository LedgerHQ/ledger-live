import { closeAllModal, openModal } from "~/renderer/actions/modals";
import { bridgeHandler } from "../bridge.handler";
import { createMockContext } from "./test-utils";

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn(() => ({ type: "OPEN_MODAL" })),
  closeAllModal: jest.fn(() => ({ type: "CLOSE_ALL_MODAL" })),
}));

const mockOpenModal = jest.mocked(openModal);
const mockCloseAllModal = jest.mocked(closeAllModal);

describe("bridge.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("bridgeHandler", () => {
    it("closes all modals and opens WebSocket bridge modal", () => {
      const context = createMockContext();

      bridgeHandler(
        {
          type: "bridge",
          origin: "https://example.com",
          appName: "MyApp",
        },
        context,
      );

      expect(context.dispatch).toHaveBeenCalledWith(mockCloseAllModal());
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

      expect(context.dispatch).toHaveBeenCalledWith(mockCloseAllModal());
      expect(context.dispatch).toHaveBeenCalledWith(
        mockOpenModal("MODAL_WEBSOCKET_BRIDGE", {
          origin: undefined,
          appName: undefined,
        }),
      );
    });
  });
});
