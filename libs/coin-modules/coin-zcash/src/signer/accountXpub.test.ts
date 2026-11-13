import type { BitcoinSigner } from "../types/signer";
import { ZCASH_XPUB_VERSION } from "../constants";
import { deriveAccountXpub } from "./accountXpub";
import { composeXpub } from "./xpub";

const PARENT_PUBKEY = "0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2";
const ACCOUNT_PUBKEY = "035a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc56";
const ACCOUNT_CHAIN_CODE = "47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141";

describe("deriveAccountXpub", () => {
  it("composes the account xpub from the keys at the parent and account paths", async () => {
    const getAddress = jest.fn(async (path: string) =>
      path === "44'/133'"
        ? { address: "t1parent", publicKey: PARENT_PUBKEY, chainCode: "" }
        : { address: "t1account", publicKey: ACCOUNT_PUBKEY, chainCode: ACCOUNT_CHAIN_CODE },
    );
    const signer = { getAddress } as unknown as BitcoinSigner;

    const xpub = await deriveAccountXpub(signer, "44'/133'/2'");

    expect(getAddress.mock.calls).toEqual([
      ["44'/133'", false],
      ["44'/133'/2'", false],
    ]);
    expect(xpub).toBe(
      composeXpub({
        xpubVersion: ZCASH_XPUB_VERSION,
        depth: 3,
        childNumber: 0x80000002,
        parentPublicKeyHex: PARENT_PUBKEY,
        accountPublicKeyHex: ACCOUNT_PUBKEY,
        accountChainCodeHex: ACCOUNT_CHAIN_CODE,
      }),
    );
  });
});
