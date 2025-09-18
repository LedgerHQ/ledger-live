import { getTxType } from "./txTrackingHelper";
import { ERC20_CLEAR_SIGNED_SELECTORS, DAPP_SELECTORS } from "@ledgerhq/hw-app-eth";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";

const createMockTransaction = (selector: string): EvmTransaction =>
  ({
    data: Buffer.from(selector.slice(2) + "0".repeat(128), "hex"),
    recipient: "0x1234567890123456789012345678901234567890",
    amount: "0",
    gasPrice: "0",
    gasLimit: "21000",
    nonce: 0,
  }) as unknown as EvmTransaction;

describe("getTxType", () => {
  describe("ERC20 transactions", () => {
    it("should return 'transfer' for ERC20 transfer selector", () => {
      const tx = createMockTransaction(ERC20_CLEAR_SIGNED_SELECTORS.TRANSFER);
      const result = getTxType(tx);
      expect(result).toBe("transfer");
    });

    it("should return 'approve' for ERC20 approve selector", () => {
      const tx = createMockTransaction(ERC20_CLEAR_SIGNED_SELECTORS.APPROVE);
      const result = getTxType(tx);
      expect(result).toBe("approve");
    });
  });

  describe("DAPP transactions", () => {
    it("should return the DAPP selector value for known DAPP transactions", () => {
      const dappSelectors = Object.keys(DAPP_SELECTORS);
      if (dappSelectors.length > 0) {
        const firstSelector = dappSelectors[0];
        const expectedValue = DAPP_SELECTORS[firstSelector];

        const tx = createMockTransaction(firstSelector);
        const result = getTxType(tx);
        expect(result).toBe(expectedValue);
      }
    });
  });

  describe("Unknown transactions", () => {
    it("should return 'transfer' for unknown selectors", () => {
      const tx = createMockTransaction("0x12345678");
      const result = getTxType(tx);
      expect(result).toBe("transfer");
    });

    it("should return 'transfer' for transactions without data", () => {
      const tx = {
        data: undefined,
      } as EvmTransaction;
      const result = getTxType(tx);
      expect(result).toBe("transfer");
    });

    it("should return 'transfer' for transactions with empty data", () => {
      const tx = {
        data: Buffer.alloc(0),
      } as EvmTransaction;
      const result = getTxType(tx);
      expect(result).toBe("transfer");
    });
  });

  describe("Selector extract", () => {
    it("should correctly extract 4-byte selector from transaction data", () => {
      const transferSelector = ERC20_CLEAR_SIGNED_SELECTORS.TRANSFER;
      const tx = createMockTransaction(transferSelector);

      const expectedSelector = transferSelector;
      const txSelector = `0x${tx.data?.toString("hex").substring(0, 8)}`;

      expect(txSelector).toBe(expectedSelector);
      expect(getTxType(tx)).toBe("transfer");
    });
  });
});
