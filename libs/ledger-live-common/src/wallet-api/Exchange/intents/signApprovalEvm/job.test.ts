import { firstValueFrom, lastValueFrom, Subject, toArray } from "rxjs";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import type { Account } from "@ledgerhq/types-live";

// `@ledgerhq/device-signer-kit-ethereum` lazily loads
// `@ledgerhq/context-module` through its `SendGetAddressTask` submodule;
// that transitive isn't installed in this package's pnpm graph, so we
// stub the surface used by both the production helper and these tests.
// The factory is inlined (no closed-over const) because jest hoists
// `jest.mock` calls above top-level declarations.
jest.mock("@ledgerhq/device-signer-kit-ethereum", () => ({
  SignTransactionDAStep: {
    GET_APP_CONFIG: "signer.eth.steps.getAppConfig",
    GET_ADDRESS: "signer.eth.steps.getAddress",
    PARSE_TRANSACTION: "signer.eth.steps.parseTransaction",
    BUILD_CONTEXTS: "signer.eth.steps.buildContexts",
    PROVIDE_CONTEXTS: "signer.eth.steps.provideContexts",
    SIGN_TRANSACTION: "signer.eth.steps.signTransaction",
    BLIND_SIGN_TRANSACTION_FALLBACK: "signer.eth.steps.blindSignTransactionFallback",
  },
}));

const SignTransactionDAStep = {
  GET_APP_CONFIG: "signer.eth.steps.getAppConfig",
  GET_ADDRESS: "signer.eth.steps.getAddress",
  PARSE_TRANSACTION: "signer.eth.steps.parseTransaction",
  BUILD_CONTEXTS: "signer.eth.steps.buildContexts",
  PROVIDE_CONTEXTS: "signer.eth.steps.provideContexts",
  SIGN_TRANSACTION: "signer.eth.steps.signTransaction",
  BLIND_SIGN_TRANSACTION_FALLBACK: "signer.eth.steps.blindSignTransactionFallback",
} as const;

let signerStates: Subject<unknown>;
const cancel = jest.fn();
const signTransaction = jest.fn(() => ({
  observable: signerStates.asObservable(),
  cancel,
}));

jest.mock("@ledgerhq/live-signer-evm", () => ({
  DmkSignerEth: jest.fn().mockImplementation(() => ({
    signer: { signTransaction },
  })),
}));

const craftTransaction = jest.fn();
jest.mock("@ledgerhq/coin-evm/logic/craftTransaction", () => ({
  craftTransaction: (...args: unknown[]) => craftTransaction(...args),
}));

const combine = jest.fn();
jest.mock("@ledgerhq/coin-evm/logic/combine", () => ({
  combine: (...args: unknown[]) => combine(...args),
}));

import { signApprovalEvmJob } from "./job";
import type { SignApprovalEvmIntentInput, SignApprovalEvmJobState } from "./types";

const FAKE_CONNECTION = {} as DeviceConnectionResult;
const FAKE_CONTEXT = {} as DeviceExtractedContext;

const BASE_INPUT: SignApprovalEvmIntentInput = {
  account: { freshAddress: "0xfrom" } as Account,
  approvalTransaction: {
    calldata: "0xabcdef",
    from: "0xfrom",
    gasLimit: 50_000,
    gasPrice: 1_000_000_000,
    to: "0xspender",
    value: "0",
  },
  currencyId: "ethereum",
  derivationPath: "44'/60'/0'/0/0",
};

function run(input: SignApprovalEvmIntentInput = BASE_INPUT) {
  return signApprovalEvmJob({
    deviceConnectionResult: FAKE_CONNECTION,
    deviceExtractedContext: FAKE_CONTEXT,
    input,
  });
}

beforeEach(() => {
  signerStates = new Subject<unknown>();
  cancel.mockClear();
  signTransaction.mockClear();
  craftTransaction.mockReset();
  craftTransaction.mockResolvedValue({ transaction: "0xdeadbeef" });
  combine.mockReset();
  combine.mockReturnValue("0xsigned");
});

// `runSignApproval` starts with `from(buildUnsignedApprovalTxHex(...))`,
// an `async` function that awaits the mocked `craftTransaction`. The
// switchMap to the DMK observable therefore lands a few microtasks
// after subscription — drain the queue before pushing into the subject.
async function flush(): Promise<void> {
  await new Promise<void>(resolve => setImmediate(resolve));
}

describe("signApprovalEvmJob", () => {
  it("emits `preparing` synchronously before any device interaction", async () => {
    const first = await firstValueFrom(run());
    expect(first).toEqual({ type: "preparing" });
    expect(signTransaction).not.toHaveBeenCalled();
  });

  it("maps a Pending context step to `loading-context`", async () => {
    const collected = lastValueFrom(run().pipe(toArray()));
    await flush();
    signerStates.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        step: SignTransactionDAStep.BUILD_CONTEXTS,
        requiredUserInteraction: "none",
      },
    });
    signerStates.complete();
    const states = await collected;
    expect(states).toEqual([{ type: "preparing" }, { type: "loading-context" }]);
  });

  it("maps Pending + requiredUserInteraction: SignTransaction to `awaiting-confirmation`", async () => {
    const collected = lastValueFrom(run().pipe(toArray()));
    await flush();
    signerStates.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        step: SignTransactionDAStep.SIGN_TRANSACTION,
        requiredUserInteraction: UserInteractionRequired.SignTransaction,
      },
    });
    signerStates.complete();
    const states = await collected;
    expect(states[states.length - 1]).toEqual({ type: "awaiting-confirmation" });
  });

  it("maps a Pending sign step to `signing`", async () => {
    const collected = lastValueFrom(run().pipe(toArray()));
    await flush();
    signerStates.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        step: SignTransactionDAStep.SIGN_TRANSACTION,
        requiredUserInteraction: "none",
      },
    });
    signerStates.complete();
    const states = await collected;
    expect(states[states.length - 1]).toEqual({ type: "signing" });
  });

  it("maps Completed to `signed`, combining the unsigned tx with the DMK signature", async () => {
    const collected = lastValueFrom(run().pipe(toArray()));
    await flush();
    const dmkSig = { r: "0x01", s: "0x02", v: 27 };
    signerStates.next({ status: DeviceActionStatus.Completed, output: dmkSig });
    signerStates.complete();
    const states = await collected;
    const terminal = states[states.length - 1] as Extract<
      SignApprovalEvmJobState,
      { type: "signed" }
    >;
    expect(terminal).toEqual({ type: "signed", signedTxHex: "0xsigned" });
    expect(combine).toHaveBeenCalledWith("0xdeadbeef", dmkSig);
  });

  it("maps Error to `failed`, surfacing the per-intent label `Sign approval failed`", async () => {
    const collected = lastValueFrom(run().pipe(toArray()));
    await flush();
    signerStates.next({
      status: DeviceActionStatus.Error,
      error: { errorCode: "6800", message: "boom" },
    });
    signerStates.complete();
    const states = await collected;
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toBe("Sign approval failed (code: 6800) - boom");
    }
  });

  it("surfaces a terminal `failed` state when craftTransaction rejects", async () => {
    craftTransaction.mockRejectedValueOnce(new Error("craft boom"));
    const states = await lastValueFrom(run().pipe(toArray()));
    expect(states[0]).toEqual({ type: "preparing" });
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toBe("craft boom");
    }
    expect(signTransaction).not.toHaveBeenCalled();
  });
});
