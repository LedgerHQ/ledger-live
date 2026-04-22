import { managerHandler } from "../manager.handler";
import { createMockContext } from "./test-utils";

describe("manager.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("managerHandler", () => {
    it("navigates to manager without query when no installApp", () => {
      const context = createMockContext();

      managerHandler({ type: "myledger" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/manager");
    });

    it("navigates to manager with search query when installApp provided", () => {
      const context = createMockContext();

      managerHandler({ type: "myledger", installApp: "bitcoin" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/manager", undefined, "?q=bitcoin");
    });

    it("handles different app names", () => {
      const context = createMockContext();

      managerHandler({ type: "myledger", installApp: "ethereum" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/manager", undefined, "?q=ethereum");
    });
  });
});
