import { lastValueFrom, type Observable } from "rxjs";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { composeXpub } from "@ledgerhq/coin-zcash/signer";
import { deriveAccountDescriptor } from "./setup";

const getAddress = jest.fn();
jest.mock("@ledgerhq/live-signer-zcash", () => ({
  DmkSignerZcash: jest.fn().mockImplementation(() => ({ getAddress })),
}));
const runOnTransport = <T>(job: (transport: never) => Observable<T>) =>
  job({ dmk: {}, sessionId: "session" } as never);

const zcash = getCryptoCurrencyById("zcash");
const PARENT_PUBKEY = "0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2";
const ACCOUNT_PUBKEY = "035a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc56";
const ACCOUNT_CHAIN_CODE = "47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141";

describe("zcash deriveAccountDescriptor", () => {
  it("derives the account's first address, then composes the xpub as the legacy sync does", async () => {
    getAddress.mockImplementation(async (path: string) => ({
      address: "t1address",
      publicKey: path === "44'/133'" ? PARENT_PUBKEY : ACCOUNT_PUBKEY,
      chainCode: ACCOUNT_CHAIN_CODE,
    }));
    const descriptor = await lastValueFrom(
      deriveAccountDescriptor(runOnTransport, zcash, candidateOf(zcash, "", 1)),
    );
    expect(getAddress.mock.calls).toEqual([
      ["44'/133'/1'/0/0", false],
      ["44'/133'", false],
      ["44'/133'/1'", false],
    ]);
    expect(descriptor).toMatchObject({
      type: "utxo",
      path: "m/44h/133h/1h",
      key: composeXpub({
        xpubVersion: 0x0488b21e,
        depth: 3,
        childNumber: 1,
        parentPublicKeyHex: PARENT_PUBKEY,
        accountPublicKeyHex: ACCOUNT_PUBKEY,
        accountChainCodeHex: ACCOUNT_CHAIN_CODE,
      }),
    });
  });
});
