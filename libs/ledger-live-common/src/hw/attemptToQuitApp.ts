import { from, Observable, of, throwError } from "rxjs";
import { catchError, concatMap } from "rxjs/operators";
import appSupportsQuitApp from "../appSupportsQuitApp";
import type { AppAndVersion } from "./connectApp";
import quitApp from "./quitApp";

export type AttemptToQuitAppEvent =
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "appDetected";
    };

const attemptToQuitApp = (
  transport,
  appAndVersion?: AppAndVersion
): Observable<AttemptToQuitAppEvent> =>
  appAndVersion && appSupportsQuitApp(appAndVersion)
    ? from(quitApp(transport)).pipe(
        concatMap(() =>
          of(<AttemptToQuitAppEvent>{
            type: "unresponsiveDevice",
          })
        ),
        catchError((e) => throwError(e))
      )
    : of({
        type: "appDetected",
      });

export default attemptToQuitApp;
