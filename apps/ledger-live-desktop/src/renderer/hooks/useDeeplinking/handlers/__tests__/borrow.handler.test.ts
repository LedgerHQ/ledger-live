import { borrowHandler } from "../borrow.handler";
import { createMockContext } from "./test-utils";

describe("borrow.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("borrowHandler", () => {
    it("navigates to borrow when no query", () => {
      const context = createMockContext();

      borrowHandler(
        {
          type: "borrow",
          path: "",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/borrow", undefined, "");
    });

    it("passes search params to borrow", () => {
      const context = createMockContext();

      borrowHandler(
        {
          type: "borrow",
          path: "",
          search: "?action=open",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/borrow", undefined, "?action=open");
    });
  });
});
