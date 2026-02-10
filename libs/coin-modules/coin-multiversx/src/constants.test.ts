import BigNumber from "bignumber.js";
import {
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
  METACHAIN_SHARD,
  MAX_PAGINATION_SIZE,
  GAS,
  GAS_PRICE,
  MIN_GAS_LIMIT,
  GAS_PER_DATA_BYTE,
  GAS_PRICE_MODIFIER,
  CHAIN_ID,
  MIN_DELEGATION_AMOUNT,
  DECIMALS_LIMIT,
  MULTIVERSX_EXPLORER_URL,
  MULTIVERSX_STAKING_POOL,
  MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
} from "./constants";

describe("constants", () => {
  describe("transaction constants", () => {
    it("TRANSACTION_OPTIONS_TX_HASH_SIGN is binary 0001", () => {
      expect(TRANSACTION_OPTIONS_TX_HASH_SIGN).toBe(0b0001);
      expect(TRANSACTION_OPTIONS_TX_HASH_SIGN).toBe(1);
    });

    it("TRANSACTION_VERSION_DEFAULT is 2", () => {
      expect(TRANSACTION_VERSION_DEFAULT).toBe(2);
    });
  });

  describe("shard constants", () => {
    it("METACHAIN_SHARD is max uint32", () => {
      expect(METACHAIN_SHARD).toBe(4294967295);
      expect(METACHAIN_SHARD).toBe(0xffffffff);
    });
  });

  describe("pagination constants", () => {
    it("MAX_PAGINATION_SIZE is 50", () => {
      expect(MAX_PAGINATION_SIZE).toBe(50);
    });
  });

  describe("gas constants", () => {
    it("GAS.ESDT_TRANSFER is 500000", () => {
      expect(GAS.ESDT_TRANSFER).toBe(500000);
    });

    it("GAS.DELEGATE is 75000000", () => {
      expect(GAS.DELEGATE).toBe(75000000);
    });

    it("GAS.CLAIM is 6000000", () => {
      expect(GAS.CLAIM).toBe(6000000);
    });

    it("GAS_PRICE is 1 Gwei (1000000000)", () => {
      expect(GAS_PRICE).toBe(1000000000);
    });

    it("MIN_GAS_LIMIT is 50000", () => {
      expect(MIN_GAS_LIMIT).toBe(50000);
    });

    it("GAS_PER_DATA_BYTE is 1500", () => {
      expect(GAS_PER_DATA_BYTE).toBe(1500);
    });

    it("GAS_PRICE_MODIFIER is 0.01", () => {
      expect(GAS_PRICE_MODIFIER).toBe(0.01);
    });
  });

  describe("chain constants", () => {
    it("CHAIN_ID is '1' (mainnet)", () => {
      expect(CHAIN_ID).toBe("1");
    });
  });

  describe("delegation constants", () => {
    it("MIN_DELEGATION_AMOUNT is 1 EGLD (10^18)", () => {
      expect(MIN_DELEGATION_AMOUNT).toBeInstanceOf(BigNumber);
      expect(MIN_DELEGATION_AMOUNT.toString()).toBe("1000000000000000000");
    });

    it("DECIMALS_LIMIT is 18", () => {
      expect(DECIMALS_LIMIT).toBe(18);
    });
  });

  describe("URL constants", () => {
    it("MULTIVERSX_EXPLORER_URL is correct", () => {
      expect(MULTIVERSX_EXPLORER_URL).toBe("https://explorer.multiversx.com");
    });
  });

  describe("contract addresses", () => {
    it("MULTIVERSX_STAKING_POOL starts with erd1", () => {
      expect(MULTIVERSX_STAKING_POOL).toMatch(/^erd1/);
      expect(MULTIVERSX_STAKING_POOL.length).toBe(62);
    });

    it("MULTIVERSX_LEDGER_VALIDATOR_ADDRESS starts with erd1", () => {
      expect(MULTIVERSX_LEDGER_VALIDATOR_ADDRESS).toMatch(/^erd1/);
      expect(MULTIVERSX_LEDGER_VALIDATOR_ADDRESS.length).toBe(62);
    });

    it("staking pool and ledger validator are different addresses", () => {
      expect(MULTIVERSX_STAKING_POOL).not.toBe(MULTIVERSX_LEDGER_VALIDATOR_ADDRESS);
    });
  });

  describe("gas calculations", () => {
    it("minimum native transfer fee is GAS_PRICE * MIN_GAS_LIMIT", () => {
      const minFee = GAS_PRICE * MIN_GAS_LIMIT;
      expect(minFee).toBe(50000000000000); // 0.00005 EGLD
    });

    it("minimum ESDT transfer fee is GAS_PRICE * GAS.ESDT_TRANSFER", () => {
      const esdtFee = GAS_PRICE * GAS.ESDT_TRANSFER;
      expect(esdtFee).toBe(500000000000000); // 0.0005 EGLD
    });

    it("delegation fee is GAS_PRICE * GAS.DELEGATE", () => {
      const delegateFee = GAS_PRICE * GAS.DELEGATE;
      expect(delegateFee).toBe(75000000000000000); // 0.075 EGLD
    });

    it("claim rewards fee is GAS_PRICE * GAS.CLAIM", () => {
      const claimFee = GAS_PRICE * GAS.CLAIM;
      expect(claimFee).toBe(6000000000000000); // 0.006 EGLD
    });
  });
});
