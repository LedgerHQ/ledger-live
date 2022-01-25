// @flow
import { Subject, Observable, throwError } from "rxjs";
import Config from "react-native-config";
import { flatMap } from "rxjs/operators";

export const rejections: Subject<void> = new Subject();
const defaultErrorCreator = () => new Error("DebugRejectSwitch");

// usage: observable.pipe(rejectionOp())
export const rejectionOp = (createError: () => Error = defaultErrorCreator) => <
  T,
>(
  observable: Observable<T>,
): Observable<T> =>
  !Config.MOCK
    ? observable
    : Observable.create(o => {
        const s = observable.subscribe(o);
        const s2 = rejections
          .pipe(flatMap(() => throwError(createError())))
          .subscribe(o);
        return () => {
          s.unsubscribe();
          s2.unsubscribe();
        };
      });

// usage: hookRejections(promise)
export const hookRejections = <T>(
  p: Promise<T>,
  createError: () => Error = defaultErrorCreator,
): Promise<T> =>
  !Config.MOCK
    ? p
    : Promise.race([
        p,
        new Promise((_, rej) => {
          const sub = rejections.subscribe(() => {
            sub.unsubscribe();
            rej(createError());
          });
        }),
      ]);
