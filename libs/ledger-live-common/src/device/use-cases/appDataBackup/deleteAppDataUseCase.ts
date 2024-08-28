import { Observable } from "rxjs";
import { DeleteAppDataEvent } from "./types";

/**
 * Delete the local app data for a specific app on a Ledger device.
 *
 * @param deleteAppDataFn function that returns observable for the delete process
 * @returns Observable<DeleteAppDataEvent>
 */
export function deleteAppDataUseCase(deleteAppDataFn: () => Observable<DeleteAppDataEvent>) {
  return deleteAppDataFn();
}
