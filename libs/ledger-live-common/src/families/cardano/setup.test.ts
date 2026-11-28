import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import type Transport from "@ledgerhq/hw-transport";
import type { CardanoSigner } from "@ledgerhq/coin-cardano/signer";
import { getNetworkParameters } from "@ledgerhq/coin-cardano/networks";

type SignerFactory = (transport: Transport) => CardanoSigner;

const mockCreatedSigners: SignerFactory[] = [];

jest.mock("../../bridge/setup", () => ({
  executeWithSigner: (createSigner: SignerFactory) => {
    mockCreatedSigners.push(createSigner);
    return jest.fn();
  },
  createResolver: jest.fn(),
}));

const FIRST_ACCOUNT_ADDRESS_APDUS = `
  => d700000000
  <= 080008009000
  => d71101002d0000058000073c8000071780000000000000000000000022058000073c80000717800000000000000200000000
  <= 00bea94629d5cf776b8374a00afa15686f0b0742dd0330f86804c61202b5de20d8ec4cd8ca0ba6183589fec7a09896b7643d2176b8a447ac369000
`;

const FIRST_ACCOUNT_PUBLIC_KEY_APDUS = `
  => d700000000
  <= 080008009000
  => d71000000d038000073c8000071780000000
  <= 806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d9000
`;

const SECOND_ACCOUNT_PUBLIC_KEY_APDUS = `
  => d700000000
  <= 080008009000
  => d71000000d038000073c8000071780000001
  <= ed5e0d059cb2eed53ea30b9ba84bb3aaa6c2364c6305a0c9a7e8944aa439884a642cc2f06e601808926e14b6e27417be0b0323d5a5149f1eebab8fc4e1fe14d49000
`;

const runWithSigner = async <T>(
  apdus: string,
  job: (signer: CardanoSigner) => Promise<T>,
): Promise<T> => {
  await import("./setup");
  const [createSigner] = mockCreatedSigners;
  const transport = await openTransportReplayer(RecordStore.fromString(apdus));
  return job(createSigner(transport));
};

describe("cardano setup createSigner", () => {
  it("derives the base address of the first account from the device", async () => {
    const result = await runWithSigner(FIRST_ACCOUNT_ADDRESS_APDUS, signer =>
      signer.getAddress({
        path: "1852'/1815'/0'/0/0",
        stakingPathString: "1852'/1815'/0'/2/0",
        networkParams: getNetworkParameters("cardano_testnet"),
        verify: false,
      }),
    );

    expect(result).toEqual({
      addressHex:
        "00bea94629d5cf776b8374a00afa15686f0b0742dd0330f86804c61202b5de20d8ec4cd8ca0ba6183589fec7a09896b7643d2176b8a447ac36",
    });
  });

  it("reads the extended public key of the first account from the device", async () => {
    const result = await runWithSigner(FIRST_ACCOUNT_PUBLIC_KEY_APDUS, signer =>
      signer.getPublicKey("1852'/1815'/0'"),
    );

    expect(result).toEqual({
      publicKeyHex: "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ce",
      chainCodeHex: "b3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d",
    });
  });

  it("reads the extended public key of the second account from the device", async () => {
    const result = await runWithSigner(SECOND_ACCOUNT_PUBLIC_KEY_APDUS, signer =>
      signer.getPublicKey("1852'/1815'/1'"),
    );

    expect(result).toEqual({
      publicKeyHex: "ed5e0d059cb2eed53ea30b9ba84bb3aaa6c2364c6305a0c9a7e8944aa439884a",
      chainCodeHex: "642cc2f06e601808926e14b6e27417be0b0323d5a5149f1eebab8fc4e1fe14d4",
    });
  });
});
