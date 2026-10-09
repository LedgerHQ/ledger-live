import { createHash } from "node:crypto";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { firstValueFrom, toArray } from "rxjs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { clearBridgeCache, getAccountBridge } from "../../bridge";
import { isGenericCoinFrameworkFamily } from "../../bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { accountGetPublicKeyLogic, type WalletAPIContext } from "../../wallet-api/logic";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "../../wallet-api/converters";

const PRIVATE_KEY = Buffer.alloc(32, 7);
const PUBLIC_KEY = Buffer.from(secp256k1.getPublicKey(PRIVATE_KEY, true)).toString("hex");
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest();

const mockDeviceSign = jest.fn(async (_path: number[], bytes: Buffer) => ({
  signature: Buffer.from(
    secp256k1.sign(sha256(bytes), PRIVATE_KEY, { prehash: false, format: "der" }),
  ),
  return_code: 0x9000,
}));
jest.mock("@ledgerhq/live-signer-cosmos", () => ({
  LegacySignerCosmos: jest.fn(() => ({ sign: mockDeviceSign })),
  DmkSignerCosmos: jest.fn(),
}));
jest.mock("../../bridge/generic-coin-framework/genericCoinFrameworkFamilies", () => ({
  ...jest.requireActual("../../bridge/generic-coin-framework/genericCoinFrameworkFamilies"),
  isGenericCoinFrameworkFamily: jest.fn(),
}));
jest.mock("../../hw/deviceAccess", () => ({
  ...jest.requireActual("../../hw/deviceAccess"),
  withDevice: () => (job: (transport: unknown) => unknown) => job({}),
}));

const CANONICAL_AMINO_SIGN_DOC =
  '{"account_number":"7","chain_id":"cosmoshub-4","fee":{"amount":[{"amount":"5000","denom":"uatom"}],"gas":"200000"},"memo":"","msgs":[{"type":"cosmos-sdk/MsgSend","value":{"amount":[{"amount":"1000","denom":"uatom"}],"from_address":"cosmos1sender","to_address":"cosmos1recipient"}}],"sequence":"3"}';

const context = {
  manifest: {},
  accounts: [],
  tracking: {
    accountGetPublicKeyRequested: jest.fn(),
    accountGetPublicKeyFail: jest.fn(),
    accountGetPublicKeySuccess: jest.fn(),
  },
} as unknown as WalletAPIContext;

describe("cosmos raw signing through the wallet-api on the generic bridge", () => {
  const account: Account = {
    ...genAccount("cosmos-raw-signing", { currency: getCryptoCurrencyById("cosmos") }),
    id: "js:2:cosmos:cosmos1sender:",
    freshAddressPath: "44'/118'/0'/0/0",
    xpub: PUBLIC_KEY,
  };

  beforeEach(() => {
    clearBridgeCache();
    jest.mocked(isGenericCoinFrameworkFamily).mockReturnValue(true);
  });

  it("should return a detached signature over the doc that verifies with account.getPublicKey", async () => {
    const accountBridge = await getAccountBridge(account);
    const events: SignOperationEvent[] = await firstValueFrom(
      accountBridge
        .signRawOperation({ account, transaction: CANONICAL_AMINO_SIGN_DOC, deviceId: "" })
        .pipe(toArray()),
    );

    expect(Buffer.from(mockDeviceSign.mock.calls[0][1]).toString()).toBe(CANONICAL_AMINO_SIGN_DOC);
    const signed = events.find(e => e.type === "signed");
    if (signed?.type !== "signed") throw new Error("no signed event");
    const { signature } = signed.signedOperation;
    expect(signature).toMatch(/^[0-9a-f]{128}$/);

    setWalletApiIdForAccountId(account.id);
    const publicKey = await accountGetPublicKeyLogic(
      { ...context, accounts: [account] },
      getWalletApiIdFromAccountId(account.id),
    );
    expect(publicKey).toBe(PUBLIC_KEY);
    expect(
      secp256k1.verify(
        Buffer.from(signature, "hex"),
        sha256(Buffer.from(CANONICAL_AMINO_SIGN_DOC)),
        Buffer.from(publicKey, "hex"),
        { prehash: false },
      ),
    ).toBe(true);
  });
});
