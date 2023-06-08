import { ReplaySubject, Observable } from "rxjs";
import { useEffect, useState } from "react";
// emit value each time it changes by reference. it replays the last value at subscribe time.
export function useReplaySubject<T>(value: T): ReplaySubject<T> {
  const [subject] = useState(() => new ReplaySubject<T>());
  useEffect(() => {
    subject.next(value);
  }, [subject, value]);
  useEffect(() => {
    return () => {
      subject.complete();
    };
  }, [subject]);
  return subject;
}
export function useObservable<T>(
  observable: Observable<T>,
  initialValue?: T,
): T | null | undefined {
  const [value, update] = useState<T | null | undefined>(initialValue || undefined);
  useEffect(() => {
    const s = observable.subscribe(update);
    return () => s.unsubscribe();
  }, [observable]);
  return value;
}
