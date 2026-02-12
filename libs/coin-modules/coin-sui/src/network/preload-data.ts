import { Subject } from "rxjs";
import type { SuiPreloadData } from "../types";

let currentPreloadedData: SuiPreloadData = { validators: [], tokens: [] };

const updates = new Subject<SuiPreloadData>();

export function getCurrentSuiPreloadData(): SuiPreloadData {
  return currentPreloadedData;
}

export function setSuiPreloadData(data: SuiPreloadData) {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}
