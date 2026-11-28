import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import type Transport from "@ledgerhq/hw-transport";
import kaspaResolver from "@ledgerhq/coin-kaspa/hw-getAddress";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { KaspaSigner } from "@ledgerhq/coin-kaspa/types/signer";

type SignerFactory = (transport: Transport) => KaspaSigner;

const mockCreatedSigners: SignerFactory[] = [];

jest.mock("../../bridge/setup", () => ({
  executeWithSigner: (createSigner: SignerFactory) => {
    mockCreatedSigners.push(createSigner);
    return jest.fn();
  },
  createResolver: jest.fn(),
}));

const FIRST_ACCOUNT_APDUS = `
  => e00500000d038000002c8001b20780000000
  <= 41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a55769000
`;

const SECOND_ACCOUNT_APDUS = `
  => e00500000d038000002c8001b20780000001
  <= 4104751b5ebd4a9d2a0a25d5c37cab4814a95335b8945cfcaa6a4138de418f581bb1d0d02f22081b3cda223a51e18a63ebdffd64803e0988b68a91802738a5a9f901206d4a2b989a82b5fb160f0151ea5d046451a291a0748f3038ecdc63d637cce00b9000
`;

const FIRST_ADDRESS = "kaspa:qzwcqqkqspqajadttpy3czw03nkhkwy2z99t9awlw0e9xn2dwngh59w30lgew";
const SECOND_ADDRESS = "kaspa:qp63kh4af2wj5z396hphe26gzj54xddcj3w0e2n2gyudusv0tqdmzrpsmzklh";

const FIRST_PUBLIC_KEY =
  "41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a5576";
const SECOND_PUBLIC_KEY =
  "4104751b5ebd4a9d2a0a25d5c37cab4814a95335b8945cfcaa6a4138de418f581bb1d0d02f22081b3cda223a51e18a63ebdffd64803e0988b68a91802738a5a9f901206d4a2b989a82b5fb160f0151ea5d046451a291a0748f3038ecdc63d637cce00b";

const openSigner = async (apdus: string): Promise<KaspaSigner> => {
  await import("./setup");
  const [createSigner] = mockCreatedSigners;
  const transport = await openTransportReplayer(RecordStore.fromString(apdus));
  return createSigner(transport);
};

describe("kaspa setup createSigner", () => {
  it("reads the account-level public key and address of the first account from the device", async () => {
    const signer = await openSigner(FIRST_ACCOUNT_APDUS);

    const result = await signer.getAddress("44'/111111'/0'", false);

    expect(result).toEqual({ publicKey: FIRST_PUBLIC_KEY, address: FIRST_ADDRESS });
  });

  it("reads the account-level public key and address of the second account from the device", async () => {
    const signer = await openSigner(SECOND_ACCOUNT_APDUS);

    const result = await signer.getAddress("44'/111111'/1'", false);

    expect(result).toEqual({ publicKey: SECOND_PUBLIC_KEY, address: SECOND_ADDRESS });
  });

  it("resolves the address, the public key and the path through the kaspa resolver", async () => {
    const signer = await openSigner(FIRST_ACCOUNT_APDUS);
    const resolve = kaspaResolver((_deviceId, job) => job(signer));

    const result = await resolve("device", {
      currency: getCryptoCurrencyById("kaspa"),
      path: "44'/111111'/0'",
      derivationMode: "",
    });

    expect(result).toEqual({
      address: FIRST_ADDRESS,
      publicKey: FIRST_PUBLIC_KEY,
      path: "44'/111111'/0'",
    });
  });
});
