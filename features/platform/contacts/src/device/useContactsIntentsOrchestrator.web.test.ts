import { act, renderHook } from "@testing-library/react";
import { EMPTY } from "rxjs";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import type { IntentPlatformDefinition } from "@features/platform-device-intent";
import {
  ContactDeviceIntentCancelledError,
  ContactDeviceIntentMissingResultError,
} from "../contactDeviceIntentsPort";
import type { ContactsIntentPlatformDefinitions } from "./types";
import { useContactsIntentsOrchestrator } from "./useContactsIntentsOrchestrator";

jest.mock("@ledgerhq/device-contacts-kit/api/model/ContactsVersionRequirements.js", () => ({
  resolveContactsVersionRequirements: () => ({
    supported: true,
    minOsVersion: "1.5.0",
    minAppVersion: { Ethereum: "1.2.3" },
  }),
}));

/** Contacts floor enforced by the mocked kit table above. */
const CONTACTS_APP_FLOOR = "1.2.3";

/**
 * The orchestrator never runs a job or renders a component: it drives everything
 * through the listeners the executor would call. Injecting inert definitions keeps
 * these assertions about orchestration only, with no coupling to the contacts kit.
 */
const mockIntentPlatformDefinition = <JobState, Input, Result>(
  label: string,
): IntentPlatformDefinition<JobState, Input, undefined, Result> => ({
  label,
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: () => EMPTY,
  component: () => null,
});

const intents: ContactsIntentPlatformDefinitions = {
  registerExternalAddress: mockIntentPlatformDefinition("mock register external address"),
  renameExternalContact: mockIntentPlatformDefinition("mock rename contact"),
  editExternalAddress: mockIntentPlatformDefinition("mock edit external address"),
  registerLedgerAccount: mockIntentPlatformDefinition("mock register Ledger account"),
  renameLedgerAccount: mockIntentPlatformDefinition("mock rename Ledger account"),
};

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
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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

  it("GIVEN an active operation WHEN its intent reports failure THEN it rejects with that failure and keeps the DIE open", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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
    // The failure's own JobState is the user-facing error screen, rendered by
    // the executor while idle (lastIntentSnapshot) -- the DIE must stay mounted
    // so it actually gets a chance to show, instead of vanishing instantly.
    expect(result.current.dieProps).toBeDefined();
  });

  it("GIVEN an active operation whose intent reported failure WHEN its observable also errors THEN it still keeps the DIE open", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);
    const error = new Error("registration failed");

    // WHEN -- a buggy job could report a failure and still let its observable
    // error afterward instead of completing; the already-showing failure
    // screen must not be ripped away because of that contract violation.
    act(() => {
      dieProps.intent.onResult?.({ type: "failure", error });
      dieProps.intent.onJobError?.(new Error("late observable error"));
    });

    // THEN
    await expect(request.promise).rejects.toBe(error);
    expect(result.current.dieProps).toBeDefined();
  });

  it("GIVEN an active operation whose intent reported failure WHEN the user dismisses the error screen THEN it closes the DIE", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);
    const error = new Error("registration failed");
    act(() => {
      dieProps.intent.onResult?.({ type: "failure", error });
      dieProps.intent.onJobComplete?.();
    });
    await expect(request.promise).rejects.toBe(error);

    // WHEN
    act(() => getActiveDieProps(result.current).onUserCancel());

    // THEN
    expect(result.current.dieProps).toBeUndefined();
  });

  it("GIVEN an active operation WHEN its intent reports multiple results THEN it keeps the first result", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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
    // Success is the only ending that dismisses the DIE on the job's behalf, so
    // this contract violation leaves it up for the user to close, same as any
    // other failure.
    expect(result.current.dieProps).toBeDefined();
  });

  it("GIVEN an active operation WHEN its observable errors THEN it rejects with the fallback error and keeps the DIE open", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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
    // The executor falls back to its generic IntentErrorComponent (retry/close)
    // for an observable error -- the DIE must stay mounted for it to be seen.
    expect(result.current.dieProps).toBeDefined();
  });

  it("GIVEN an active operation whose observable errored WHEN the user dismisses the fallback screen THEN it closes the DIE", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);
    const error = new Error("unexpected observable error");
    act(() => {
      dieProps.intent.onJobError?.(error);
    });
    await expect(request.promise).rejects.toBe(error);

    // WHEN
    act(() => getActiveDieProps(result.current).onUserCancel());

    // THEN
    expect(result.current.dieProps).toBeUndefined();
  });

  it("GIVEN a job has not started WHEN the user cancels THEN it rejects without waiting for job unsubscription", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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

  it("GIVEN an active operation WHEN the executor reports it stopped THEN it rejects the active request", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);

    // WHEN
    act(() => {
      dieProps.onExecutorStopped?.();
    });

    // THEN
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentCancelledError);
  });

  it("GIVEN a stopped executor WHEN a later run reports success THEN it keeps the rejection", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });
    const dieProps = getActiveDieProps(result.current);
    act(() => {
      dieProps.onExecutorStopped?.();
    });

    // WHEN
    act(() => {
      dieProps.intent.onResult?.(registerExternalAddressSuccessResult(request));
    });

    // THEN
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentCancelledError);
  });

  it("GIVEN a job has not started WHEN the Contacts surface unmounts THEN it rejects the active request", async () => {
    // GIVEN
    const { result, unmount } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
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

describe("useContactsIntentsOrchestrator initializerConfig", () => {
  it("GIVEN no injected live-config floor WHEN an intent is active THEN it still enforces the Contacts floor", async () => {
    // GIVEN
    const { result } = renderHook(() => useContactsIntentsOrchestrator({ intents }));
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });

    // WHEN
    const dieProps = getActiveDieProps(result.current);
    const getMinVersion = dieProps.initializerConfig?.dependencies?.getMinVersion;

    // THEN
    expect(getMinVersion?.("Ethereum", DeviceModelId.STAX)).toBe(CONTACTS_APP_FLOOR);

    act(() => dieProps.onUserCancel());
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentCancelledError);
  });

  it("GIVEN an injected live-config floor lower than the Contacts floor WHEN an intent is active THEN it enforces the Contacts floor", async () => {
    // GIVEN
    const { result } = renderHook(() =>
      useContactsIntentsOrchestrator({ intents, getLiveConfigMinVersion: () => "0.0.1" }),
    );
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });

    // WHEN
    const dieProps = getActiveDieProps(result.current);
    const getMinVersion = dieProps.initializerConfig?.dependencies?.getMinVersion;

    // THEN
    expect(getMinVersion?.("Ethereum", DeviceModelId.STAX)).toBe(CONTACTS_APP_FLOOR);

    act(() => dieProps.onUserCancel());
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentCancelledError);
  });

  it("GIVEN an injected live-config floor higher than the Contacts floor WHEN an intent is active THEN it enforces the live-config floor", async () => {
    // GIVEN
    const { result } = renderHook(() =>
      useContactsIntentsOrchestrator({ intents, getLiveConfigMinVersion: () => "999.0.0" }),
    );
    let request!: ReturnType<typeof startRegisterExternalAddress>;
    act(() => {
      request = startRegisterExternalAddress(result.current);
    });

    // WHEN
    const dieProps = getActiveDieProps(result.current);
    const getMinVersion = dieProps.initializerConfig?.dependencies?.getMinVersion;

    // THEN
    expect(getMinVersion?.("Ethereum", DeviceModelId.STAX)).toBe("999.0.0");

    act(() => dieProps.onUserCancel());
    await expect(request.promise).rejects.toBeInstanceOf(ContactDeviceIntentCancelledError);
  });
});
