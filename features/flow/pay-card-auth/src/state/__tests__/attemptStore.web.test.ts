import { clearAttempt, loadAttempt, saveAttempt } from "../attemptStore.web";

const attempt = { state: "state-value", codeVerifier: "verifier-value" };

describe("attemptStore (web)", () => {
  afterEach(async () => {
    await clearAttempt();
  });

  it("reads nothing before a login starts", async () => {
    await expect(loadAttempt()).resolves.toBeNull();
  });

  it("reads back the attempt it stored", async () => {
    await saveAttempt(attempt);

    await expect(loadAttempt()).resolves.toEqual(attempt);
  });

  it("forgets the attempt", async () => {
    await saveAttempt(attempt);

    await clearAttempt();

    await expect(loadAttempt()).resolves.toBeNull();
  });
});
