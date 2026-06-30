import { lastValueFrom, of, toArray } from "rxjs";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import type { Account, EIP712Message } from "@ledgerhq/types-live";
import type { SignTypedDataEvmRunState } from "../shared/signTypedDataEvm";

const runSignTypedDataEvm = jest.fn();
jest.mock("../shared/signTypedDataEvm", () => ({
  runSignTypedDataEvm: (...args: unknown[]) => runSignTypedDataEvm(...args),
}));

import { signPermit2EvmJob } from "./job";
import type { SignPermit2EvmIntentInput } from "./types";

const FAKE_CONNECTION = {} as DeviceConnectionResult;
const FAKE_CONTEXT = {} as DeviceExtractedContext;

const BASE_INPUT: SignPermit2EvmIntentInput = {
  account: { freshAddress: "0xfrom" } as Account,
  currencyId: "ethereum",
  derivationPath: "44'/60'/0'/0/0",
  typedData: { primaryType: "PermitSingle" } as unknown as EIP712Message,
};

function run(input: SignPermit2EvmIntentInput = BASE_INPUT) {
  return signPermit2EvmJob({
    deviceConnectionResult: FAKE_CONNECTION,
    deviceExtractedContext: FAKE_CONTEXT,
    input,
  });
}

beforeEach(() => {
  runSignTypedDataEvm.mockReset();
});

describe("signPermit2EvmJob", () => {
  it("prepends `preparing` and forwards Permit2 input to the shared typed-data signer", async () => {
    const failure = { type: "failed", error: new Error("boom") } as const;
    runSignTypedDataEvm.mockReturnValueOnce(
      of<SignTypedDataEvmRunState>(failure),
    );

    const states = await lastValueFrom(run().pipe(toArray()));
    const [connection, typedData, path, errorLabel] = runSignTypedDataEvm.mock.calls[0];
    expect(connection).toBe(FAKE_CONNECTION);
    expect(typedData).toBe(BASE_INPUT.typedData);
    expect(path).toBe(BASE_INPUT.derivationPath);
    expect(errorLabel).toBe("Sign permit failed");
    expect(states).toEqual([{ type: "preparing" }, failure]);
  });
});
