import { lastValueFrom } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { RunOnTransport } from "../../coin-modules/types";
import { deriveAccountDescriptor } from "./setup";

const getAddress = jest.fn();
jest.mock("@ledgerhq/hw-app-kaspa", () => jest.fn().mockImplementation(() => ({ getAddress })));
const transport: Transport = Object.create(Transport.prototype);
const runOnTransport: RunOnTransport = job => job(transport, new AbortController().signal);

const kaspa = getCryptoCurrencyById("kaspa");
const EXTENDED_KEY = `41${"04".repeat(65)}${"47".repeat(32)}`;

describe("kaspa deriveAccountDescriptor", () => {
  it("reads the key at the account path, as the legacy scan does", async () => {
    getAddress.mockResolvedValue({ address: "kaspa:qq", publicKey: EXTENDED_KEY });
    const descriptor = await lastValueFrom(
      deriveAccountDescriptor(runOnTransport, kaspa, candidateOf(kaspa, "", 2)),
    );
    expect(getAddress.mock.calls).toEqual([["44'/111111'/2'", false]]);
    expect(descriptor).toMatchObject({ type: "utxo", key: EXTENDED_KEY, path: "m/44h/111111h/2h" });
  });
});
