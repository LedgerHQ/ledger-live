import { Observable } from "rxjs";
import { map } from "rxjs/operators";

// from https://github.com/NiklasPor/rxjs-boost (MIT)

/**
 * Throws the error built by `errorFn` if `conditionFn` evaluates to be truthy.
 *
 * @param conditionFn Determines if an error should be thrown.
 * @param errorFn Evaluates to the error which can be thrown.
 *
 * @example
 * ```
 * const input = cold('   ft', { f: false, t: true });
 * const expected = cold('f#', { f: false }, 'error');
 *
 * const result = input.pipe(
 *   // will throw 'error' for values === true
 *   throwIf(
 *     (val) => val
 *     () => error
 *   )
 * );
 * ```
 */
export function throwIf<T>(
  conditionFn: (value: T, index: number) => boolean,
  errorFn: (value: T, index: number) => any
) {
  return (input: Observable<T>) =>
    input.pipe(
      map((value, index) => {
        if (conditionFn(value, index)) {
          throw errorFn(value, index);
        }

        return value;
      })
    );
}
