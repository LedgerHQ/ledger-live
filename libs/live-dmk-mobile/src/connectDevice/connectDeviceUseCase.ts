import { Observable, EMPTY } from "rxjs";
import { ConnectDeviceUIState } from "./types";

export function connectDeviceUseCase(): Observable<ConnectDeviceUIState> {
  return EMPTY;
}
