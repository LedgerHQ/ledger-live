import type { Job } from "@features/platform-device-intent";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import type {
  RegisterExternalAddressDAOutput,
  RegisterExternalAddressDAState,
} from "@ledgerhq/device-contacts-kit/api/app-binder/RegisterExternalAddressDeviceActionTypes.js";
import { Observable } from "rxjs";
import {
  mapDeviceActionErrorToFailureJobState,
  mapDmkErrorToError,
} from "../../contactsDeviceActionFailure";
import {
  mapBytesToGroupHandle,
  mapBytesToProof,
  mapChainIdToBigInt,
  mapGroupHandleToBytes,
  mapIdentifierToBytes,
  mapProofToBytes,
} from "../../contactsKitMappers";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
import type {
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressJobState,
  RegisterExternalAddressResult,
} from "./types";

function mapExistingContactGroupToBytes(
  existingContactGroup: RegisterExternalAddressIntentInput["existingContactGroup"],
): { groupHandle: Uint8Array; hmacProof: Uint8Array } | undefined {
  if (existingContactGroup === undefined) return undefined;

  return {
    groupHandle: mapGroupHandleToBytes(existingContactGroup.groupHandle),
    hmacProof: mapProofToBytes(existingContactGroup.hmacProof),
  };
}

function mapDeviceActionOutputToResult(
  input: RegisterExternalAddressIntentInput,
  output: RegisterExternalAddressDAOutput,
): RegisterExternalAddressResult {
  return {
    mode: output.mode,
    // Echo the caller's own representations, not the kit's, so the persisted
    // record stays in Ledger Wallet's own conventions (family taxonomy,
    // chainId representation) rather than the kit's wire-level ones.
    contactName: input.contactName,
    scope: input.scope,
    address: input.address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: mapBytesToGroupHandle(output.groupHandle),
    hmacProof: mapBytesToProof(output.hmacProof),
    hmacRest: mapBytesToProof(output.hmacRest),
  };
}

/**
 * Register an external address on the device via the Contacts kit's
 * `ContactsManager.registerExternalAddress()`.
 *
 * DIE Phase 2 already opened the coin app and enforced the version floor
 * (see `getContactsAppMinVersion`), so this always passes `skipOpenApp: true`
 * — the kit's own version guard still runs regardless.
 */
export const registerExternalAddressIntentJob: Job<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  ContactIntentResult<RegisterExternalAddressResult>
> = ({ deviceConnectionResult, deviceExtractedContext, input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);

  return new Observable<RegisterExternalAddressJobState>(subscriber => {
    let identifier: Uint8Array;
    let chainId: bigint;
    let existingContactGroup: { groupHandle: Uint8Array; hmacProof: Uint8Array } | undefined;
    try {
      identifier = mapIdentifierToBytes(input.address);
      chainId = mapChainIdToBigInt(input.chainId);
      existingContactGroup = mapExistingContactGroupToBytes(input.existingContactGroup);
    } catch (error) {
      const jobState: RegisterExternalAddressJobState = {
        type: "invalid-input",
        error: mapDmkErrorToError(error),
      };
      reporter.report({ type: "failure", error: jobState.error });
      subscriber.next(jobState);
      subscriber.complete();
      return undefined;
    }

    const contactsManager = new ContactsManagerBuilder({
      dmk: deviceConnectionResult.dmk,
      sessionId: deviceConnectionResult.sessionId,
      appName: deviceExtractedContext.currentAppName,
    }).build();

    const { observable, cancel } = contactsManager.registerExternalAddress({
      contactName: input.contactName,
      scope: input.scope,
      identifier,
      // The kit's family table is keyed by the lowercased coin-app name
      // (e.g. "ethereum"), distinct from Ledger Wallet's own family
      // grouping (e.g. "evm") carried in `input.blockchainFamily`.
      blockchainFamily: deviceExtractedContext.currentAppName.toLowerCase(),
      chainId,
      existingContactGroup,
      skipOpenApp: true,
    });

    const subscription = observable.subscribe({
      next: (state: RegisterExternalAddressDAState) => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted:
          case DeviceActionStatus.Pending:
            subscriber.next(
              state.status === DeviceActionStatus.Pending &&
                state.intermediateValue.requiredUserInteraction ===
                  UserInteractionRequired.RegisterWallet
                ? {
                    type: "awaiting-device-confirmation",
                    deviceModelId: deviceConnectionResult.connectedDevice.modelId,
                    deviceName: deviceConnectionResult.compatDeviceName,
                  }
                : { type: "pending" },
            );
            return;
          case DeviceActionStatus.Completed: {
            const result = mapDeviceActionOutputToResult(input, state.output);
            reporter.report({ type: "success", result });
            subscriber.next({ type: "completed" });
            subscriber.complete();
            return;
          }
          case DeviceActionStatus.Stopped: {
            const jobState: RegisterExternalAddressJobState = {
              type: "failed",
              error: new Error("Register external address was stopped"),
            };
            reporter.report({ type: "failure", error: jobState.error });
            subscriber.next(jobState);
            subscriber.complete();
            return;
          }
          case DeviceActionStatus.Error: {
            const jobState = mapDeviceActionErrorToFailureJobState(state.error);
            reporter.report({ type: "failure", error: jobState.error });
            subscriber.next(jobState);
            subscriber.complete();
            return;
          }
        }
      },
      error: (error: unknown) => {
        const jobState: RegisterExternalAddressJobState = {
          type: "failed",
          error: mapDmkErrorToError(error),
        };
        reporter.report({ type: "failure", error: jobState.error });
        subscriber.error(jobState.error);
      },
    });

    return () => {
      subscription.unsubscribe();
      cancel();
    };
  }).pipe(reporter.cancelOnUnsubscribe());
};
