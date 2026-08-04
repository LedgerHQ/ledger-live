import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "./errors";

describe("live-network error classes", () => {
  describe("LedgerAPI4xx", () => {
    it("sets name and message", () => {
      const e = new LedgerAPI4xx("Not Found");
      expect(e.name).toBe("LedgerAPI4xx");
      expect(e.message).toBe("Not Found");
      expect(e).toBeInstanceOf(Error);
    });
    it("falls back to class name when no message given", () => {
      expect(new LedgerAPI4xx().message).toBe("LedgerAPI4xx");
    });
    it("assigns extra fields", () => {
      const e = new LedgerAPI4xx("err", { status: 404 });
      expect((e as Record<string, unknown>).status).toBe(404);
    });
  });

  describe("LedgerAPI5xx", () => {
    it("sets name and message", () => {
      const e = new LedgerAPI5xx("Server Error");
      expect(e.name).toBe("LedgerAPI5xx");
      expect(e.message).toBe("Server Error");
      expect(e).toBeInstanceOf(Error);
    });
    it("falls back to class name when no message given", () => {
      expect(new LedgerAPI5xx().message).toBe("LedgerAPI5xx");
    });
    it("assigns extra fields", () => {
      const e = new LedgerAPI5xx("err", { status: 503 });
      expect((e as Record<string, unknown>).status).toBe(503);
    });
  });

  describe("NetworkDown", () => {
    it("sets name", () => {
      const e = new NetworkDown();
      expect(e.name).toBe("NetworkDown");
      expect(e.message).toBe("NetworkDown");
      expect(e).toBeInstanceOf(Error);
    });
    it("accepts a custom message", () => {
      expect(new NetworkDown("timeout").message).toBe("timeout");
    });
  });
});
