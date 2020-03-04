// @flow

import { ReplaySubject } from "rxjs";
import { useEffect, useState } from "react";

// emit value each time it changes by reference. it replays the last value at subscribe time.
export function useReplaySubject<T>(value: T): ReplaySubject<T> {
  const [subject] = useState(() => new ReplaySubject());
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
