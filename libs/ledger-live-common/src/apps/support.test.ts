import { mustUpgrade, shouldUpgrade } from "./support";

describe("Support.ts", () => {
  describe("shouldUpgrade", () => {
    it("should ask for an ugprade for an outdated Bitcoin nano app", () => {
      expect(shouldUpgrade("Bitcoin", "0.1.0")).toBe(true);
    });

    it("should not ask for any ugprade for a valid Bitcoin nano app", () => {
      expect(shouldUpgrade("Bitcoin", "1.4.0")).toBe(false);
    });

    it("should not ask for any ugprade for a valid Bitcoin nano app with a pre-release tag", () => {
      expect(shouldUpgrade("Bitcoin", "1.4.0-dev")).toBe(false);
    });
  });

  describe("mustUpgrade", () => {
    it("should ask an upgrade for an outdated nano app", () => {
      expect(mustUpgrade("Ethereum", "0.1.0")).toBe(true);
    });

    it("should not ask any upgrade for the latest Ethereum nano app", () => {
      expect(mustUpgrade("Ethereum", "1.10.3")).toBe(false);
    });

    it("should not ask any upgrade for the latest Ethereum nano app with a pre-release tag for a version equal to the minimum version", () => {
      expect(mustUpgrade("Ethereum", "1.10.3-dev")).toBe(false);
    });

    it("should not ask any upgrade for the latest Ethereum nano app with a pre-release tag for a version superior to the minimum version", () => {
      expect(mustUpgrade("Ethereum", "1.10.4-dev")).toBe(false);
    });
  });
});
