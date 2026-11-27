import { Subject, Observable, throwError, PartialObserver } from "rxjs";
import Config from "react-native-config";
import { mergeMap } from "rxjs/operators";

export const rejections: Subject<void> = new Subject();

const defaultErrorCreator = () => new Error("DebugRejectSwitch");

// usage: observable.pipe(rejectionOp())
export const rejectionOp =
  (createError: () => Error = defaultErrorCreator) =>
  <T>(observable: Observable<T>): Observable<T> =>
    !Config.MOCK
      ? observable
      : new Observable((o: PartialObserver<T>) => {
          const s = observable.subscribe(o);
          const s2 = rejections.pipe(mergeMap(() => throwError(() => createError()))).subscribe(o);
          return () => {
            s.unsubscribe();
            s2.unsubscribe();
          };
        });
