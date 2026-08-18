import { secureStore } from "./secureStore.web";

describe("secureStore.web", () => {
  afterEach(async () => {
    await secureStore.remove("payCard.session.accessToken");
  });

  it("reads an absent key as null", async () => {
    await expect(secureStore.read("payCard.session.accessToken")).resolves.toBeNull();
  });

  it("reads back what it wrote", async () => {
    await secureStore.write("payCard.session.accessToken", "at_token");

    await expect(secureStore.read("payCard.session.accessToken")).resolves.toBe("at_token");
  });

  it("forgets a removed key", async () => {
    await secureStore.write("payCard.session.accessToken", "at_token");

    await secureStore.remove("payCard.session.accessToken");

    await expect(secureStore.read("payCard.session.accessToken")).resolves.toBeNull();
  });
});
