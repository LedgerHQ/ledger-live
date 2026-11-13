import { lastValueFrom, type Observable } from "rxjs";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { deriveAccountDescriptor } from "./setup";

const deriveAddress = jest.fn();
const getExtendedPublicKey = jest.fn();
jest.mock("@cardano-foundation/ledgerjs-hw-app-cardano", () => ({
  ...jest.requireActual("@cardano-foundation/ledgerjs-hw-app-cardano"),
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ deriveAddress, getExtendedPublicKey })),
}));
const runOnTransport = <T>(job: (transport: never) => Observable<T>) => job({} as never);

const cardano = getCryptoCurrencyById("cardano");
const BASE_ADDRESS_HEX = `01${"aa".repeat(28)}${"bb".repeat(28)}`;
const PUBLIC_KEY = "35".repeat(32);
const CHAIN_CODE = "47".repeat(32);

describe("cardano deriveAccountDescriptor", () => {
  it("derives the account's first address, then reads the extended key at the account path", async () => {
    deriveAddress.mockResolvedValue({ addressHex: BASE_ADDRESS_HEX });
    getExtendedPublicKey.mockResolvedValue({ publicKeyHex: PUBLIC_KEY, chainCodeHex: CHAIN_CODE });
    const descriptor = await lastValueFrom(
      deriveAccountDescriptor(runOnTransport, cardano, candidateOf(cardano, "cardano", 3)),
    );
    expect(deriveAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({
          params: {
            spendingPath: [1852 + 0x80000000, 1815 + 0x80000000, 3 + 0x80000000, 0, 0],
            stakingPath: [1852 + 0x80000000, 1815 + 0x80000000, 3 + 0x80000000, 2, 0],
          },
        }),
      }),
    );
    expect(getExtendedPublicKey).toHaveBeenCalledWith({
      path: [1852 + 0x80000000, 1815 + 0x80000000, 3 + 0x80000000],
    });
    expect(descriptor).toMatchObject({
      type: "utxo",
      key: `${PUBLIC_KEY}${CHAIN_CODE}`,
      path: "m/1852h/1815h/3h",
    });
  });
});
