import { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { ZIP317_MARGINAL_FEE } from "./chain-adapters/zcash/coin-selection";

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

// The ZIP-317 marginal fee (5000 zats) spread over one P2PKH input's vbytes.
const oneInputVBytes =
  maxTxVBytesCeil(1, [], false, zcashCrypto, DerivationModes.LEGACY) -
  maxTxVBytesCeil(0, [], false, zcashCrypto, DerivationModes.LEGACY);
const expectedFeePerByte = Math.ceil(ZIP317_MARGINAL_FEE / oneInputVBytes);

describe("getAccountNetworkInfo for Zcash (ZIP-317 pricing)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("prices from the ZIP-317 marginal fee, not the explorer's sat/vByte data", async () => {
    // The derived sat/vB should be far below the explorer's `/fees` values (~1000 sat/vB).
    expect(oneInputVBytes).toBeGreaterThan(0);
    expect(expectedFeePerByte).toBeGreaterThan(0);
    expect(expectedFeePerByte).toBeLessThan(200);

    const info = await getAccountNetworkInfo(zcashAccount());
    expect(info.feeItems.defaultFeePerByte.toNumber()).toBe(expectedFeePerByte);
  });

  it("does not call the explorer's fee market for Zcash", async () => {
    await getAccountNetworkInfo(zcashAccount());
    expect(getFees).not.toHaveBeenCalled();
  });

  it("returns three identical speeds (Zcash has no fee market)", async () => {
    const info = await getAccountNetworkInfo(zcashAccount());
    expect(info.feeItems.items.map(i => i.speed)).toEqual(["fast", "medium", "slow"]);
    info.feeItems.items.forEach(item =>
      expect(item.feePerByte.toNumber()).toBe(expectedFeePerByte),
    );
  });
});
