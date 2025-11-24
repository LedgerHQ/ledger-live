import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { createApi } from "../api";

// TODO: implement proper integration tests
describe("createApi", () => {
  const api = createApi({}, "aleo");

  beforeAll(() => {
    setupCalClientStore();
  });

  describe("broadcast", () => {
    it("should throw not supported error", () => {
      expect(() => api.broadcast("tx")).toThrow();
    });
  });
});
