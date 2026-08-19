import { concat, defer, of, timer, type Observable } from "rxjs";
import { catchError, filter, finalize, ignoreElements, map, takeWhile } from "rxjs/operators";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import type { DeviceConnectionResult, Job } from "@features/platform-device-intent";
import type {
  GetEthAddressDMKSignerDemoIntentInput,
  GetEthAddressDMKSignerDemoIntentJobState,
} from "./types";

const TERMINAL_DELAY_MS = 3000;

function runGetEthAddress(
  connectionResult: DeviceConnectionResult,
  derivationPath: string,
): Observable<GetEthAddressDMKSignerDemoIntentJobState> {
  return defer(() => {
    const { dmk, sessionId } = connectionResult;
    const signer = new SignerEthBuilder({ dmk, sessionId }).build();
    const { observable, cancel } = signer.getAddress(derivationPath, {
      skipOpenApp: true,
    });

    return observable.pipe(
      finalize(cancel),
      map(state => {
        if (state.status === DeviceActionStatus.Pending) {
          return {
            type: "deriving" as const,
            daStatus: state.status,
            userInteraction: state.intermediateValue.requiredUserInteraction,
          };
        }
        if (state.status === DeviceActionStatus.Completed) {
          return { type: "derived" as const, address: state.output.address };
        }
        if (state.status === DeviceActionStatus.Error) {
          return { type: "failed" as const, error: state.error };
        }
        return null;
      }),
      filter((state): state is NonNullable<typeof state> => state !== null),
      takeWhile(state => state.type === "deriving", true),
      catchError(error => of<GetEthAddressDMKSignerDemoIntentJobState>({ type: "failed", error })),
    );
  });
}

export const getEthAddressDMKSignerDemoIntentJob: Job<
  GetEthAddressDMKSignerDemoIntentJobState,
  GetEthAddressDMKSignerDemoIntentInput
> = ({ deviceConnectionResult, input }) =>
  concat(
    runGetEthAddress(deviceConnectionResult, input.derivationPath),
    timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
  );
