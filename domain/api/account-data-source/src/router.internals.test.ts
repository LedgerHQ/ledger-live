import { AccountDataAbortedError } from "./errors";
import { createLimiter } from "./router.internals";

describe("createLimiter", () => {
  it("does not run a task aborted between getting its slot and starting", async () => {
    const run = createLimiter(1);
    let finishFirst: () => void = () => undefined;
    const first = run(() => new Promise<void>(resolve => (finishFirst = resolve)));
    const controller = new AbortController();
    const task = jest.fn(async () => 2);
    const second = run(task, controller.signal);
    finishFirst();
    queueMicrotask(() => controller.abort());
    await first;
    await expect(second).rejects.toBeInstanceOf(AccountDataAbortedError);
    expect(task).not.toHaveBeenCalled();
    await expect(run(async () => 3)).resolves.toBe(3);
  });
});
