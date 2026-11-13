import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
  IntentDefinition,
} from "@features/platform-device-intent";
import type { Observable } from "rxjs";

export type ScanAccountsIntentJobState<Item> =
  | {
      readonly type: "scanning";
      readonly items: readonly Item[];
      readonly stop: () => void;
    }
  | {
      readonly type: "done";
      readonly items: readonly Item[];
    }
  | {
      readonly type: "error";
      readonly error: Error;
      readonly items: readonly Item[];
    };

export type StartScan<Item> = (deviceConnectionResult: DeviceConnectionResult) => Observable<Item>;

export type ScanAccountsIntentInput<Item> = {
  readonly startScan: StartScan<Item>;
};

export type ScanAccountsIntentResult<Item> = readonly Item[];

export type ScanAccountsJobParams<Item> = {
  readonly deviceConnectionResult: DeviceConnectionResult;
  readonly deviceExtractedContext: DeviceExtractedContext;
  readonly input: ScanAccountsIntentInput<Item>;
  readonly onResult: (result: ScanAccountsIntentResult<Item>) => void;
};

export type ScanAccountsIntentDefinition<Item> = IntentDefinition<
  ScanAccountsIntentJobState<Item>,
  ScanAccountsIntentInput<Item>,
  ScanAccountsIntentResult<Item>
>;
