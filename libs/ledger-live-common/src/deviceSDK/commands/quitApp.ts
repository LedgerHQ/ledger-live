import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";


export function quitApp(
  transport: Transport
): Observable<void> {
  return new Observable((observer) => {
    transport.send(0xb0, 0xa7, 0x00, 0x00).then(
      () => {
        observer.next();
        observer.complete();
      }      
    )
  });
}
