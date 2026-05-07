import {
  lastValueFrom,
  Observable,
  catchError,
  defaultIfEmpty,
  ignoreElements,
  tap,
  throwError,
} from "rxjs";

type RunObservableOptions<T> = {
  source$: Observable<T>;
  onNext?: (value: T) => void;
  mapError?: (error: unknown) => unknown;
};

export async function runObservable<T>({
  source$,
  onNext,
  mapError,
}: RunObservableOptions<T>): Promise<void> {
  await lastValueFrom(
    source$.pipe(
      tap(value => onNext?.(value)),
      catchError(error => throwError(() => (mapError ? mapError(error) : error))),
      ignoreElements(),
      defaultIfEmpty(undefined),
    ),
  );
}
