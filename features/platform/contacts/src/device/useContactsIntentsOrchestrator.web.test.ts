import { act, renderHook } from "@testing-library/react";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import {
  ContactDeviceIntentCancelledError,
  ContactDeviceIntentMissingResultError,
} from "../contactDeviceIntentsPort";
import { useContactsIntentsOrchestrator } from "./useContactsIntentsOrchestrator";

function startRegisterExternalAddress(
  orchestrator: ReturnType<typeof useContactsIntentsOrchestrator>,
) {
  const contact = mockContactWithAddress();
  const address = contact.addresses[0];
  if (address === undefined || contact.deviceCredentials === undefined) {
    throw new Error("The test contact must have an address and device credentials");
  }

  const promise = orchestrator.deviceIntents.registerExternalAddress({
    contact,
    currencyId: address.currencyId,
    label: address.label,
    address: address.address,
  });

  return { address, contact, credentials: contact.deviceCredentials, promise };
}

function getActiveDieProps(orchestrator: ReturnType<typeof useContactsIntentsOrchestrator>) {
  if (orchestrator.dieProps === undefined) {
    throw new Error("Expected an active Contacts intent");
  }
  return orchestrator.dieProps;
}

describe("useContactsIntentsOrchestrator", () => {
  it("GIVEN an active operation WHEN its intent reports success THEN it resolves the mapped port result", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);

    // WHEN
    act(() => {
      dieProps.intent.onResult?.({
        type: "success",
        result: {
          mode: "existingContactGroup",
          contactName: request.contact.name,
          scope: request.address.label,
          address: request.address.address,
          blockchainFamily: request.address.device.blockchainFamily,
          chainId: request.address.device.chainId,
          groupHandle: request.credentials.groupHandle,
          hmacProof: request.credentials.hmacProof,
          hmacRest: request.address.device.hmacRest,
        },
      });
    });

    // THEN
    await expect(request.promise).resolves.toEqual({
      deviceCredentials: request.credentials,
      addressDeviceContext: request.address.device,
    });
  });

  it("GIVEN an active operation WHEN its intent reports failure THEN it rejects with that failure", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);
    const error = new Error("registration failed");

    // WHEN
    act(() => {
      dieProps.intent.onResult?.({ type: "failure", error });
    });

    // THEN
    await expect(request.promise).rejects.toBe(error);
  });

  it("GIVEN an active operation without a result WHEN its job completes THEN it rejects the missing Result contract", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);

    // WHEN
    act(() => {
      dieProps.intent.onJobComplete?.();
    });

    // THEN
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentMissingResultError);
    expect(result.current.dieProps).toBeUndefined();
  });

  it("GIVEN an active operation WHEN its observable errors THEN it rejects with the fallback error", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);
    const error = new Error("unexpected observable error");

    // WHEN
    act(() => {
      dieProps.intent.onJobError?.(error);
    });

    // THEN
    await expect(request.promise).rejects.toBe(error);
    expect(result.current.dieProps).toBeUndefined();
  });

  it("GIVEN a job has not started WHEN the user cancels THEN it rejects without waiting for job unsubscription", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);

    // WHEN
    act(() => {
      dieProps.onUserCancel();
    });

    // THEN
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentCancelledError);
    expect(result.current.dieProps).toBeUndefined();
  });

  it("GIVEN a job has not started WHEN the Contacts surface unmounts THEN it rejects the active request", async () => {
    // GIVEN
    const { result, unmount } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });

    // WHEN
    unmount();

    // THEN
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentCancelledError);
  });
});
