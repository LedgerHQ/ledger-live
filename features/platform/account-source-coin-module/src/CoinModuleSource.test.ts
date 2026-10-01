import { describe, expect, it } from "@jest/globals";
import { createAccountDataRouter, NoAccountSourceError } from "@domain/api-account-data-source";
import { ref } from "@domain/api-account-data-source/testing";
import { CoinModuleSource } from "./CoinModuleSource";

describe("CoinModuleSource", () => {
  it("serves no datum yet", async () => {
    const router = createAccountDataRouter([new CoinModuleSource()]);
    await expect(router.read("counter", ref)).rejects.toBeInstanceOf(NoAccountSourceError);
  });
});
