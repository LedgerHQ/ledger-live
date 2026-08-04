import { findCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import hederaCoinConfig from "../config";
import { MAINNET_TEST_ACCOUNTS } from "../test/fixtures/account.fixture";
import { getTokenCurrencyFromCAL } from "../test/fixtures/currency.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import type { HederaMirrorTransaction } from "../types/mirror";
import { apiClient } from "./api";
import { hgraphClient } from "./hgraph";
import { rpcClient } from "./rpc";
import {
  analyzeStakingOperation,
  calculateUncommittedBalanceChange,
  checkAccountTokenAssociationStatus,
  enrichERC20Transfers,
  getCurrencyToUSDRate,
  toEVMAddress,
} from "./utils";

const coinConfig = getMockedConfig();

beforeAll(() => {
  hederaCoinConfig.setCoinConfig(() => coinConfig);
});

afterAll(async () => {
  await rpcClient._resetInstance();
});

describe("toEVMAddress", () => {
  it("should resolve from an account id to a long-zero EVM address for an account without EVM alias", async () => {
    const address = await toEVMAddress({ configOrCurrencyId: coinConfig, accountId: "0.0.12345" });
    expect(address).toEqual("0x0000000000000000000000000000000000003039");
  });

  it("should resolve from a long-zero EVM address to a long-zero EVM address for an account without EVM alias", async () => {
    const address = await toEVMAddress({
      configOrCurrencyId: coinConfig,
      accountId: "0x0000000000000000000000000000000000003039",
    });
    expect(address).toEqual("0x0000000000000000000000000000000000003039");
  });

  it("should resolve from a long-zero EVM address without prefix to a long-zero EVM address for an account without EVM alias", async () => {
    const address = await toEVMAddress({
      configOrCurrencyId: coinConfig,
      accountId: "0000000000000000000000000000000000003039",
    });
    expect(address).toEqual("0x0000000000000000000000000000000000003039");
  });

  it("should resolve from an account id to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress({
      configOrCurrencyId: coinConfig,
      accountId: "0.0.9806001",
    });
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from an EVM alias address to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress({
      configOrCurrencyId: coinConfig,
      accountId: "0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc",
    });
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from an EVM alias address without prefix to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress({
      configOrCurrencyId: coinConfig,
      accountId: "cf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc",
    });
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from a long-zero EVM address to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress({
      configOrCurrencyId: coinConfig,
      accountId: "0x000000000000000000000000000000000095a0b1",
    });
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });

  it("should resolve from a long-zero EVM address without prefix to an EVM alias address for an account with an EVM alias", async () => {
    const address = await toEVMAddress({
      configOrCurrencyId: coinConfig,
      accountId: "000000000000000000000000000000000095a0b1",
    });
    expect(address).toEqual("0xcf15538fa293ab04cdd7ce45bcdac8b6e2dc7ebc");
  });
});

describe("getCurrencyToUSDRate", () => {
  it("returns a live, plausible HBAR/USD rate rather than falling back to null", async () => {
    const currency = findCryptoCurrencyById("hedera");
    invariant(currency, "hedera currency should be registered");

    const rate = await getCurrencyToUSDRate(currency);

    expect(rate).not.toBeNull();
    expect(BigNumber.isBigNumber(rate)).toBe(true);
    expect(rate?.isGreaterThan(0)).toBe(true);
    expect(rate?.isLessThan(100)).toBe(true);
  });
});

describe("checkAccountTokenAssociationStatus", () => {
  const usdcToken = getTokenCurrencyFromCAL(0); // HTS USDC "0.0.456858"

  it("returns true when account has the HTS token associated", async () => {
    const result = await checkAccountTokenAssociationStatus(
      MAINNET_TEST_ACCOUNTS.withTokens.accountId,
      usdcToken,
    );
    expect(result).toBe(true);
  });

  it("returns false when account does not have the HTS token associated", async () => {
    const result = await checkAccountTokenAssociationStatus(
      MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
      usdcToken,
    );
    expect(result).toBe(false);
  });
});

describe("calculateUncommittedBalanceChange", () => {
  it("returns a BigNumber for a valid timestamp range", async () => {
    const result = await calculateUncommittedBalanceChange({
      configOrCurrencyId: coinConfig,
      address: MAINNET_TEST_ACCOUNTS.withStakingHistory.accountId,
      startTimestamp: "1762200000.000000000",
      endTimestamp: "1762210000.000000000",
    });
    expect(BigNumber.isBigNumber(result)).toBe(true);
    expect(result.isNaN()).toBe(false);
  });
});

describe("enrichERC20Transfers", () => {
  it("enriches raw hgraph ERC20 transfers with mirror transaction data", async () => {
    const rawTransfers = await hgraphClient.getERC20Transfers({
      configOrCurrencyId: coinConfig,
      address: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
      tokenEvmAddresses: [MAINNET_TEST_ACCOUNTS.withTokens.erc20Token],
      fetchAllPages: false,
      limit: 3,
    });

    // guard: with no raw transfers the loop below would assert nothing
    expect(rawTransfers.length).toBeGreaterThan(0);

    const enriched = await enrichERC20Transfers({
      configOrCurrencyId: coinConfig,
      erc20Transfers: rawTransfers,
    });

    expect(enriched.length).toBeGreaterThan(0);
    for (const e of enriched) {
      expect(e.transfers.length).toBeGreaterThan(0);
      expect(e.mirrorTransaction).not.toBeUndefined();
      expect(typeof e.mirrorTransaction.consensus_timestamp).toBe("string");
      expect(typeof e.mirrorTransaction.transaction_hash).toBe("string");
    }
  });
});

describe("analyzeStakingOperation", () => {
  const DELEGATE_HASH = "+07jwNyyEDuwngDgoW3sVgfTfDE5qn+HgPsbltlrUIW/n/LYpFSEwSQNOTu/8GLQ";
  const UNDELEGATE_HASH = "v0jXJwjKaypunqz91EuQDU2mz/ejSb3AvEJ5fgYkftl+DDT2mBlwB5bSRqXWyoth";
  const REDELEGATE_HASH = "pm8vFWlcBEEPbB+pkZTUUxs0FfO2KyDtg0KNfOYnnba+rpHT63OIMhFKKNpfDokk";

  const address = MAINNET_TEST_ACCOUNTS.withStakingHistory.accountId;
  let transactions: HederaMirrorTransaction[];

  beforeAll(async () => {
    // desc order from a fixed past cursor, so newer activity on the account cannot
    // shift these three transactions out of the fetched window
    ({ transactions } = await apiClient.getAccountTransactions({
      configOrCurrencyId: coinConfig,
      address,
      pagingToken: "1772617523.000000000",
      order: "desc",
      limit: 30,
      fetchAllPages: false,
    }));
  });

  const analyze = async (hash: string) => {
    const mirrorTx = transactions.find(tx => tx.transaction_hash === hash);
    invariant(mirrorTx, `transaction ${hash} missing from the fetched window`);

    const result = await analyzeStakingOperation({
      configOrCurrencyId: coinConfig,
      address,
      mirrorTx,
    });
    expect(result).not.toBeNull();

    return result;
  };

  it("classifies a DELEGATE transaction correctly", async () => {
    const result = await analyze(DELEGATE_HASH);

    expect(result?.operationType).toBe("DELEGATE");
    expect(result?.previousStakingNodeId).toBeNull();
    expect(result?.targetStakingNodeId).not.toBeNull();
    expect(result?.stakedAmount).toBeGreaterThan(0n);
  });

  it("classifies an UNDELEGATE transaction correctly", async () => {
    const result = await analyze(UNDELEGATE_HASH);

    expect(result?.operationType).toBe("UNDELEGATE");
    expect(result?.previousStakingNodeId).not.toBeNull();
    expect(result?.targetStakingNodeId).toBeNull();
    expect(result?.stakedAmount).toBeGreaterThan(0n);
  });

  it("classifies a REDELEGATE transaction correctly", async () => {
    const result = await analyze(REDELEGATE_HASH);

    expect(result?.operationType).toBe("REDELEGATE");
    expect(result?.previousStakingNodeId).not.toBeNull();
    expect(result?.targetStakingNodeId).not.toBeNull();
    expect(result?.previousStakingNodeId).not.toBe(result?.targetStakingNodeId);
    expect(result?.stakedAmount).toBeGreaterThan(0n);
  });
});
