import { Subject, Observable, throwError, PartialObserver } from "rxjs";
import Config from "react-native-config";
import { flatMap } from "rxjs/operators";

export const rejections: Subject<void> = new Subject();

const defaultErrorCreator = () => new Error("DebugRejectSwitch");

// usage: observable.pipe(rejectionOp())
export const rejectionOp =
  (createError: () => Error = defaultErrorCreator) =>
  <T>(observable: Observable<T>): Observable<T> =>
    !Config.MOCK
      ? observable
      : Observable.create((o: PartialObserver<T>) => {
          const s = observable.subscribe(o);
          const s2 = rejections.pipe(flatMap(() => throwError(() => createError()))).subscribe(o);
          return () => {
            s.unsubscribe();
            s2.unsubscribe();
          };
        });
// usage: hookRejections(promise)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const hookRejections = <T>(
  p: Promise<T>,
  createError: () => Error = defaultErrorCreator,
): Promise<T> =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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
