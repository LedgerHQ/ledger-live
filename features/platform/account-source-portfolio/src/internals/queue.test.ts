import { createSerialQueue } from "./queue";

describe("createSerialQueue", () => {
  it("runs one task at a time, in call order", async () => {
    const queue = createSerialQueue();
    const events: string[] = [];
    const task = (name: string) => async () => {
      events.push(`start ${name}`);
      await Promise.resolve();
      events.push(`end ${name}`);
      return name;
    };

    const results = await Promise.all([queue.run(task("a")), queue.run(task("b"))]);

    expect(results).toEqual(["a", "b"]);
    expect(events).toEqual(["start a", "end a", "start b", "end b"]);
  });

  it("does not let a failed task block the next", async () => {
    const queue = createSerialQueue();
    const failed = queue.run(() => Promise.reject(new Error("boom")));
    const next = queue.run(async () => "next");

    await expect(failed).rejects.toThrow("boom");
    await expect(next).resolves.toBe("next");
  });
});
