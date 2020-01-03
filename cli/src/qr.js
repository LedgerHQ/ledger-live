// @flow

import { Observable } from "rxjs";
import qrcode from "qrcode-terminal";

export const asQR = (str: string) =>
  Observable.create(o =>
    qrcode.generate(str, r => {
      o.next(r);
      o.complete();
    })
  );
