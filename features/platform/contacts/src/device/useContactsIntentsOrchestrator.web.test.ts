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

function registerExternalAddressSuccessResult(
  request: ReturnType<typeof startRegisterExternalAddress>,
) {
  return {
    type: "success" as const,
    result: {
      mode: "existingContactGroup" as const,
      contactName: request.contact.name,
      scope: request.address.label,
      address: request.address.address,
      blockchainFamily: request.address.device.blockchainFamily,
      chainId: request.address.device.chainId,
      groupHandle: request.credentials.groupHandle,
      hmacProof: request.credentials.hmacProof,
      hmacRest: request.address.device.hmacRest,
    },
  };
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
      dieProps.intent.onResult?.(registerExternalAddressSuccessResult(request));
      dieProps.intent.onJobComplete?.();
    });

    // THEN
    await expect(request.promise).resolves.toEqual({
      deviceCredentials: request.credentials,
      addressDeviceContext: request.address.device,
    });
    expect(result.current.dieProps).toBeUndefined();
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
      dieProps.intent.onJobComplete?.();
    });

    // THEN
    await expect(request.promise).rejects.toBe(error);
    expect(result.current.dieProps).toBeUndefined();
  });

  it("GIVEN an active operation WHEN its intent reports multiple results THEN it keeps the first result", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);

    // WHEN
    act(() => {
      dieProps.intent.onResult?.(registerExternalAddressSuccessResult(request));
      dieProps.intent.onResult?.({ type: "failure", error: new Error("late failure") });
      dieProps.intent.onJobComplete?.();
    });

    // THEN
    await expect(request.promise).resolves.toEqual({
      deviceCredentials: request.credentials,
      addressDeviceContext: request.address.device,
    });
    expect(result.current.dieProps).toBeUndefined();
  });

  it("GIVEN an active operation with a result WHEN its job errors THEN it preserves the result and dismisses the DIE", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator());
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);

    // WHEN
    act(() => {
      dieProps.intent.onResult?.(registerExternalAddressSuccessResult(request));
      dieProps.intent.onJobError?.(new Error("late job error"));
    });

    // THEN
    await expect(request.promise).resolves.toEqual({
      deviceCredentials: request.credentials,
      addressDeviceContext: request.address.device,
    });
    expect(result.current.dieProps).toBeUndefined();
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
      dieProps.intent.onResult?.({ type: "failure", error: new Error("late failure") });
      dieProps.intent.onJobError?.(new Error("late job error"));
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
