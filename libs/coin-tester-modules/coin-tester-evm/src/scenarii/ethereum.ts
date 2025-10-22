import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { makeAccount } from "../fixtures";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import {
  EvmNftTransaction,
  Transaction as EvmTransaction,
} from "@ledgerhq/coin-evm/types/transaction";
import { killAnvil, spawnAnvil } from "../anvil";
import { callMyDealer, ethereum, VITALIK, getBridges } from "../helpers";
import { indexBlocks, initMswHandlers, resetIndexer, setBlock } from "../indexer";
import { defaultNanoApp } from "../constants";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { BridgeStrategy } from "@ledgerhq/coin-tester/types";

type EthereumScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

const usdcOnEthereum = findTokenById("ethereum/erc20/usd__coin");
if (!usdcOnEthereum) throw new Error("USDC on Ethereum token not found");
const USDC_ON_ETHEREUM = usdcOnEthereum;
const boredApeContract = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
const boredApeTokenId = "3368";
const cloneXContract = "0x348FC118bcC65a92dC033A951aF153d14D945312";
const cloneXTokenId = "951";

const makeScenarioTransactions = ({
  address,
  strategy,
}: {
  address: string;
  strategy: BridgeStrategy;
}): EthereumScenarioTransaction[] => {
  const scenarioSendEthTransaction: EthereumScenarioTransaction = {
    name: "Send 1 ETH",
    amount: new BigNumber(1e18),
    recipient: VITALIK,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1e18).toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const scenarioSendUSDCTransaction: EthereumScenarioTransaction = {
    name: "Send USDC",
    amount: new BigNumber(ethers.parseUnits("80", USDC_ON_ETHEREUM.units[0].magnitude).toString()),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:ethereum:${address}:`, USDC_ON_ETHEREUM),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.parseUnits("20", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
      );
    },
  };

  const scenarioSendERC721Transaction: ScenarioTransaction<
    EvmTransaction & EvmNftTransaction,
    Account
  > = {
    name: "Send ERC721",
    recipient: VITALIK,
    mode: "erc721",
    nft: {
      tokenId: boredApeTokenId,
      contract: boredApeContract,
      quantity: new BigNumber(1),
      collectionName: "Bored Ape",
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(currentAccount.nfts?.every(nft => nft.contract !== boredApeContract)).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: boredApeContract,
        tokenId: boredApeTokenId,
        value: new BigNumber(1),
      });
    },
  };

  const scenarioSendERC1155Transaction: ScenarioTransaction<
    EvmTransaction & EvmNftTransaction,
    Account
  > = {
    name: "Send ERC1155",
    recipient: VITALIK,
    mode: "erc1155",
    nft: {
      tokenId: "951",
      contract: cloneXContract,
      collectionName: "Clone X",
      quantity: new BigNumber(2),
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(currentAccount.nfts?.every(nft => nft.contract !== cloneXContract)).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: cloneXContract,
        tokenId: cloneXTokenId,
        value: new BigNumber(2),
      });
    },
  };

  return [
    scenarioSendEthTransaction,
    scenarioSendUSDCTransaction,
    ...(strategy === "legacy"
      ? [scenarioSendERC721Transaction, scenarioSendERC1155Transaction]
      : []),
  ];
};

export const scenarioEthereum: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic ETH Transactions",
  setup: async strategy => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://ethereum-rpc.publicnode.com"),
    ]);

    setCoinConfig(() => ({
      info: {
        status: {
          type: "active",
        },
        gasTracker: {
          type: "ledger",
          explorerId: "eth",
        },
        node: {
          type: "external",
          uri: "http://127.0.0.1:8545",
        },
        explorer: {
          type: "ledger",
          explorerId: "eth",
        },
        showNfts: true,
      },
    }));
    LiveConfig.setConfig({
      config_currency_ethereum: {
        type: "object",
        default: {
          status: {
            type: "active",
          },
          gasTracker: {
            type: "ledger",
            explorerId: "eth",
          },
          node: {
            type: "external",
            uri: "http://127.0.0.1:8545",
          },
          explorer: {
            type: "ledger",
            explorerId: "eth",
          },
          showNfts: true,
        },
      },
    });

    initMswHandlers(getCoinConfig(ethereum).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const { currencyBridge, accountBridge, getAddress } = getBridges(
      strategy,
      transport,
      "ethereum",
    );
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: ethereum,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, ethereum);

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    setBlock(lastBlockNumber + 1);

    // Get USDC
    await callMyDealer({
      provider,
      drug: USDC_ON_ETHEREUM,
      junkie: address,
      dose: ethers.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude),
    });

    // Get a Bored Ape
    await callMyDealer({
      provider,
      drug: {
        type: "Nft",
        tokenId: boredApeTokenId,
        contractAddress: boredApeContract,
        standard: "ERC721",
      },
      junkie: address,
      dose: 1n,
    });

    // Get 2 CloneX
    await callMyDealer({
      provider,
      drug: {
        type: "Nft",
        tokenId: cloneXTokenId,
        contractAddress: cloneXContract,
        standard: "ERC1155",
      },
      junkie: address,
      dose: 2n,
    });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
      onSignerConfirmation,
    };
  },
  beforeAll: (account, strategy) => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    expect(account.subAccounts?.[0].type).toBe("TokenAccount");
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(strategy === "legacy" ? 2 : 0);
  },
  getTransactions: (address, strategy) => makeScenarioTransactions({ address, strategy }),
  beforeSync: async () => {
    await indexBlocks();
  },
  afterAll: (account, strategy) => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(0);
    expect(account.operations.length).toBe(strategy === "legacy" ? 7 : 3);
  },
  teardown: async () => {
    resetIndexer();
    await Promise.all([killSpeculos(), killAnvil()]);
  },
};
