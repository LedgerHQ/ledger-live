import { MonoTypeOperatorFunction } from "rxjs";
import { delay as delayOperator, retryWhen, scan } from "rxjs/operators";
import { throwIf } from "./throwIf";

// from https://github.com/NiklasPor/rxjs-boost (MIT)

/**
 * Retries an Observable with a [delay].
 * Will retry [count] times. Defaults to `1`.
 *
 * @param delay The delay (milliseconds) the operator will wait before each retry.
 *              This also includes the first try.
 * @param count The number of times the operator will retry the execution.
 *              Defaults to `1`.
 */
export function retryWithDelay<T>(
  delay: number,
  count = 1
): MonoTypeOperatorFunction<T> {
  return (input) =>
    input.pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((acc, error) => ({ count: acc.count + 1, error }), {
            count: 0,
            error: undefined as any,
          }),
          throwIf(
            (current) => current.count > count,
            (current) => current.error
          ),
          delayOperator(delay)
        )
      )
    );
}
