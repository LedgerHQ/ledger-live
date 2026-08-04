import { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { ZIP317_MARGINAL_FEE, ZIP317_MINIMUM_FEE } from "./chain-adapters/zcash/coin-selection";

const getFees = jest.fn().mockResolvedValue({ "2": 1000002, "4": 1000001, "6": 1000000 });

const zcashCrypto = cryptoFactory("zcash");
const walletAccount = {
  xpub: {
    crypto: zcashCrypto,
    derivationMode: DerivationModes.LEGACY,
    explorer: {
      getFees,
      getNetwork: jest.fn().mockResolvedValue({ relay_fee: "0.000001" }),
    },
  },
};

jest.mock("./getWalletAccount", () => ({
  getWalletAccount: jest.fn(() => walletAccount),
}));

import { getAccountNetworkInfo } from "./getAccountNetworkInfo";

const zcashAccount = () => ({ currency: { id: "zcash" } }) as unknown as Account;

const vbytes = (inputCount: number, outputCount: number) =>
  maxTxVBytesCeil(
    inputCount,
    Array(Math.max(0, outputCount - 1)).fill(Buffer.alloc(25)),
    outputCount > 0,
    zcashCrypto,
    DerivationModes.LEGACY,
  );

describe("getAccountNetworkInfo for Zcash (ZIP-317 pricing)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not call the explorer's fee market for Zcash", async () => {
    await getAccountNetworkInfo(zcashAccount());
    expect(getFees).not.toHaveBeenCalled();
  });

  it("returns three identical speeds (Zcash has no fee market)", async () => {
    const info = await getAccountNetworkInfo(zcashAccount());
    expect(info.feeItems.items.map(i => i.speed)).toEqual(["fast", "medium", "slow"]);
    const rates = info.feeItems.items.map(i => i.feePerByte.toNumber());
    expect(new Set(rates).size).toBe(1);
    expect(rates[0]).toBe(info.feeItems.defaultFeePerByte.toNumber());
  });

  // The account-wide rate is the fallback used whenever prepareTransaction cannot
  // tighten it, so underpaying here means a transaction the network rejects.
  it("covers the ZIP-317 minimum on the smallest transaction it can price", async () => {
    const { defaultFeePerByte } = (await getAccountNetworkInfo(zcashAccount())).feeItems;
    expect(defaultFeePerByte.times(vbytes(1, 1)).toNumber()).toBeGreaterThanOrEqual(
      ZIP317_MINIMUM_FEE,
    );
  });

  it("covers ZIP-317 for every larger layout too", async () => {
    const { defaultFeePerByte } = (await getAccountNetworkInfo(zcashAccount())).feeItems;
    for (let inputCount = 1; inputCount <= 20; inputCount++) {
      for (const outputCount of [1, 2]) {
        const required = ZIP317_MARGINAL_FEE * Math.max(2, Math.max(inputCount, outputCount));
        expect(
          defaultFeePerByte.times(vbytes(inputCount, outputCount)).toNumber(),
        ).toBeGreaterThanOrEqual(required);
      }
    }
  });
});
