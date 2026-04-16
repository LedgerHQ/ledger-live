import { recoverHandler, recoverRestoreFlowHandler } from "../recover.handler";
import { createMockContext } from "./test-utils";

describe("recover.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("recoverHandler", () => {
    it("navigates to recover page with path", () => {
      const context = createMockContext();

      recoverHandler(
        {
          type: "recover",
          path: "protect-setup",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/recover/protect-setup", undefined, "");
    });

    it("passes search params through", () => {
      const context = createMockContext();

      recoverHandler(
        {
          type: "recover",
          path: "platform",
          search: "?step=2",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/recover/platform", undefined, "?step=2");
    });

    it("handles empty path by navigating to /recover/ when no recoverAppId in context", () => {
      const context = createMockContext();

      recoverHandler(
        {
          type: "recover",
          path: "",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/recover/", undefined, "");
    });

    it("uses recoverAppId from context when path is empty (e.g. ledgerwallet://recover)", () => {
      const context = createMockContext({ recoverAppId: "protect-id" });

      recoverHandler(
        {
          type: "recover",
          path: "",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/recover/protect-id", undefined, "");
    });
  });

  describe("recoverRestoreFlowHandler", () => {
    it("navigates to recover-restore page", () => {
      const context = createMockContext();

      recoverRestoreFlowHandler({ type: "recover-restore-flow" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/recover-restore");
    });
  });
});
