// @flow

import Observable from "rxjs/Observable";

type AccountUpdatesObservable = Observable<(Account) => Account>;

export const syncAccount = ({ id }: Account): AccountUpdatesObservable =>
  Observable.create(o => {
    o.complete();
  });
