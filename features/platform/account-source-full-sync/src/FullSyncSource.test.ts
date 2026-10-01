import { describe, expect, it } from "@jest/globals";
import { createAccountDataRouter, NoAccountSourceError } from "@domain/api-account-data-source";
import { ref } from "@domain/api-account-data-source/testing";
import { FullSyncSource } from "./FullSyncSource";

describe("FullSyncSource", () => {
  it("serves no datum yet", async () => {
    const router = createAccountDataRouter([new FullSyncSource()]);
    await expect(router.read("counter", ref)).rejects.toBeInstanceOf(NoAccountSourceError);
  });
});
