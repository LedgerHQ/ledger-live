import { firstValueFrom, toArray } from "rxjs";
import { fromAsyncOperation } from "./observable";

describe("fromAsyncOperation", () => {
  test("emits values and completes when the async function resolves", async () => {
    const values = await firstValueFrom(
      fromAsyncOperation<number>(async observer => {
        observer.next(1);
        observer.next(2);
      }).pipe(toArray()),
    );

    expect(values).toEqual([1, 2]);
  });

  test("propagates errors when the async function rejects", async () => {
    const error = new Error("boom");

    await expect(
      firstValueFrom(
        fromAsyncOperation(async () => {
          throw error;
        }),
      ),
    ).rejects.toThrow("boom");
  });
});
