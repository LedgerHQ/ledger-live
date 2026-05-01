import { perpsHandler } from "../perps.handler";
import { createMockContext } from "./test-utils";

describe("perps.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("perpsHandler", () => {
    it("navigates to /perps", () => {
      const context = createMockContext();

      perpsHandler({ type: "perps" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/perps");
    });
  });
});
