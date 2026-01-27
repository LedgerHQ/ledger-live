import { Observable } from "rxjs";
import type { Observer } from "rxjs";

export const fromAsyncOperation = <T>(
  main: (observer: Observer<T>) => Promise<void>,
): Observable<T> =>
  new Observable<T>(observer => {
    main(observer).then(
      () => observer.complete(),
      error => observer.error(error),
    );
  });
