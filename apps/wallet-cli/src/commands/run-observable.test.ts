import { describe, expect, it } from "bun:test";
import { concat, of, throwError } from "rxjs";
import { runObservable } from "./run-observable";

describe("runObservable", () => {
  it("consumes every emitted value before completing", async () => {
    const seen: number[] = [];

    await runObservable({
      source$: of(1, 2, 3),
      onNext: value => seen.push(value),
    });

    expect(seen).toEqual([1, 2, 3]);
  });

  it("maps observable errors before rethrowing", async () => {
    const originalError = new Error("boom");
    const mappedError = new Error("mapped");

    await expect(
      runObservable({
        source$: concat(
          of("before-error"),
          throwError(() => originalError),
        ),
        mapError: error => {
          expect(error).toBe(originalError);
          return mappedError;
        },
      }),
    ).rejects.toBe(mappedError);
  });
});
