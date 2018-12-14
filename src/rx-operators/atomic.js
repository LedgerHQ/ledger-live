// @flow

import { Observable } from "rxjs";

export default <T>(input: Observable<T>): Observable<T> => {
  const queue = [];
  const next = () => {
    const f = queue.pop();
    if (f) f();
  };

  return Observable.create(o => {
    let sub;
    let unsubscribed = false;

    const job = () => {
      if (!unsubscribed) {
        sub = input.subscribe(o);
      }
    };

    if (queue.length === 0) job();
    else queue.unshift(job);

    return () => {
      unsubscribed = true;
      if (sub) sub.unsubscribe();
      next();
    };
  });
};
