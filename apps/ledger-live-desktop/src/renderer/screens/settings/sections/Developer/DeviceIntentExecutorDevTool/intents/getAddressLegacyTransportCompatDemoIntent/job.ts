import { concat, defer, from, of, timer } from "rxjs";
import { catchError, ignoreElements, map } from "rxjs/operators";
import type { DerivationMode } from "@ledgerhq/types-live";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Job } from "@features/platform-device-intent";
import type {
  GetAddressLegacyTransportCompatDemoIntentInput,
  GetAddressLegacyTransportCompatDemoIntentJobState,
} from "./types";

const TERMINAL_DELAY_MS = 3000;

export const getAddressLegacyTransportCompatDemoIntentJob: Job<
  GetAddressLegacyTransportCompatDemoIntentJobState,
  GetAddressLegacyTransportCompatDemoIntentInput
> = ({ deviceConnectionResult, input }) =>
  concat(
    of<GetAddressLegacyTransportCompatDemoIntentJobState>({ type: "deriving" }),
    defer(() => {
      const transport = new DmkCompatTransport(
        deviceConnectionResult.dmk,
        deviceConnectionResult.sessionId,
      );
      return concat(
        of<GetAddressLegacyTransportCompatDemoIntentJobState>({ type: "gotTransport" }),
        from(
          getAddress(transport, {
            currency: getCryptoCurrencyById(input.currencyId),
            path: input.path,
            derivationMode: input.derivationMode as DerivationMode, // eslint-disable-line @typescript-eslint/consistent-type-assertions
          }),
        ).pipe(map(result => ({ type: "completed" as const, address: result.address }))),
      );
    }).pipe(
      catchError(err =>
        of<GetAddressLegacyTransportCompatDemoIntentJobState>({ type: "failed", error: err }),
      ),
    ),
    timer(TERMINAL_DELAY_MS).pipe(ignoreElements()),
  );
