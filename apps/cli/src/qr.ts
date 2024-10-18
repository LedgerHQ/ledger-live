import { Observable } from "rxjs";
import qrcode from "qrcode-terminal";
export const asQR = (str: string): Observable<string> =>
  new Observable(o =>
    qrcode.generate(str, undefined, (r: string) => {
      o.next(r);
      o.complete();
    }),
  );
