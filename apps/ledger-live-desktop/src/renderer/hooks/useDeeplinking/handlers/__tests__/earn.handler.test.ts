import { earnHandler } from "../earn.handler";
import { createMockContext } from "./test-utils";

describe("earn.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("earnHandler", () => {
    it("navigates to earn dashboard when no path", () => {
      const context = createMockContext();

      earnHandler(
        {
          type: "earn",
          path: "",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/earn", undefined, "");
    });

    it("passes search params to earn dashboard", () => {
      const context = createMockContext();

      earnHandler(
        {
          type: "earn",
          path: "",
          search: "?action=stake",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/earn", undefined, "?action=stake");
    });

    it("navigates with deposit intent when path is deposit", () => {
      const context = createMockContext();

      earnHandler(
        {
          type: "earn",
          path: "deposit",
          cryptoAssetId: "ethereum",
          accountId: "account-123",
          search: "?ref=campaign",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith(
        "/earn",
        {
          intent: "deposit",
          cryptoAssetId: "ethereum",
          accountId: "account-123",
        },
        "?ref=campaign",
      );
    });

    it("uses empty strings for missing deposit params", () => {
      const context = createMockContext();

      earnHandler(
        {
          type: "earn",
          path: "deposit",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith(
        "/earn",
        {
          intent: "deposit",
          cryptoAssetId: "",
          accountId: "",
        },
        "",
      );
    });

    it("navigates without deposit intent for other paths", () => {
      const context = createMockContext();

      earnHandler(
        {
          type: "earn",
          path: "stake",
          search: "",
        },
        context,
      );

      expect(context.navigate).toHaveBeenCalledWith("/earn", undefined, "");
    });
  });
});
