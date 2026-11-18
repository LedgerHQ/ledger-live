import { flushInRounds } from "./flushInRounds";

describe("flushInRounds", () => {
  it("stops after the first round without new writes", async () => {
    const flushRound = jest
      .fn<Promise<boolean>, []>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await flushInRounds(flushRound);

    expect(flushRound).toHaveBeenCalledTimes(2);
  });

  it("stops after 5 rounds when new writes keep coming", async () => {
    const flushRound = jest.fn(async () => true);

    await flushInRounds(flushRound);

    expect(flushRound).toHaveBeenCalledTimes(5);
  });
});
