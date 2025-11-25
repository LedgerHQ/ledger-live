import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, initMswHandlers, setBlock, indexBlocks } from "../indexer";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { getCoinConfig, setCoinConfig } from "@ledgerhq/coin-evm/config";
import { makeAccount } from "../fixtures";
import { callMyDealer, getBridges, polygon, VITALIK } from "../helpers";
import { defaultNanoApp } from "../constants";
import { killAnvil, spawnAnvil } from "../anvil";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { USDC_ON_POLYGON } from "../tokenFixtures";

type PolygonScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;
const yootContract = "0x670fd103b1a08628e9557cD66B87DeD841115190";
const yootTokenId = "1953";
const emberContract = "0xa5511E9941E303101b50675926Fd4d9c1A8a8805";
const platinumTokenId = "4";

const makeScenarioTransactions = ({
  address,
  strategy,
}: {
  address: string;
  strategy: BridgeStrategy;
}) => {
  const send1MaticTransaction: PolygonScenarioTransaction = {
    name: "Send 1 POL",
    amount: new BigNumber(ethers.parseEther("1").toString()),
    recipient: ethers.ZeroAddress,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(
        latestOperation.fee.plus(new BigNumber("1000000000000000000")).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const send80USDCTransaction: PolygonScenarioTransaction = {
    name: "Send 80 USDC",
    recipient: VITALIK,
    amount: new BigNumber(ethers.parseUnits("80", USDC_ON_POLYGON.units[0].magnitude).toString()),
    subAccountId: encodeTokenAccountId(`js:2:polygon:${address}:`, USDC_ON_POLYGON),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.parseUnits("80", USDC_ON_POLYGON.units[0].magnitude).toString(),
      );
    },
  };

  const sendERC721Transaction: PolygonScenarioTransaction = {
    name: "Send ERC721",
    recipient: VITALIK,
    mode: "erc721",
    nft: {
      tokenId: yootTokenId,
      contract: yootContract,
      quantity: new BigNumber(1),
      collectionName: "Courtyard.io",
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(currentAccount.nfts?.every(nft => nft.contract !== yootContract)).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: yootContract,
        tokenId: yootTokenId,
        value: new BigNumber(1),
      });
    },
  };

  const sendERC1155Transaction: PolygonScenarioTransaction = {
    name: "Send ERC1155",
    recipient: VITALIK,
    mode: "erc1155",
    nft: {
      contract: emberContract,
      tokenId: platinumTokenId,
      quantity: new BigNumber(10),
      collectionName: "Ember Sword Badge",
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(currentAccount.nfts?.every(nft => nft.contract !== emberContract)).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: emberContract,
        tokenId: platinumTokenId,
        value: new BigNumber(10),
      });
    },
  };

  return [
    send1MaticTransaction,
    send80USDCTransaction,
    ...(strategy === "legacy" ? [sendERC721Transaction, sendERC1155Transaction] : []),
  ];
};

export const scenarioPolygon: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic Polygon Transactions",
  setup: async strategy => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://polygon-bor-rpc.publicnode.com"),
    ]);

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    setBlock(lastBlockNumber + 1);

    setCoinConfig(() => ({
      info: {
        status: {
          type: "active",
        },
        node: {
          type: "external",
          uri: "http://127.0.0.1:8545",
        },
        gasTracker: {
          type: "ledger",
          explorerId: "matic",
        },
        explorer: {
          type: "ledger",
          explorerId: "matic",
        },
        showNfts: true,
      },
    }));
    LiveConfig.setConfig({
      config_currency_polygon: {
        type: "object",
        default: {
          status: {
            type: "active",
          },
          gasTracker: {
            type: "ledger",
            explorerId: "matic",
          },
          node: {
            type: "external",
            uri: "http://127.0.0.1:8545",
          },
          explorer: {
            type: "ledger",
            explorerId: "matic",
          },
          showNfts: true,
        },
      },
    });
    initMswHandlers(getCoinConfig(polygon).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const { currencyBridge, accountBridge, getAddress } = getBridges(
      strategy,
      transport,
      "polygon",
    );
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: polygon,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, polygon);

    setBlock(lastBlockNumber + 1);

    // Send 100 USDC to the scenario account
    await callMyDealer({
      provider,
      drug: USDC_ON_POLYGON,
      junkie: address,
      dose: ethers.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude),
    });

    // Get 1 yoot
    await callMyDealer({
      provider,
      drug: {
        type: "Nft",
        tokenId: yootTokenId,
        contractAddress: yootContract,
        standard: "ERC721",
      },
      junkie: address,
      dose: 1n,
    });

    await callMyDealer({
      provider,
      drug: {
        type: "Nft",
        tokenId: platinumTokenId,
        contractAddress: emberContract,
        standard: "ERC1155",
      },
      junkie: address,
      dose: 10n,
    });

    return { currencyBridge, accountBridge, account: scenarioAccount, onSignerConfirmation };
  },
  getTransactions: (address, strategy) => makeScenarioTransactions({ address, strategy }),
  beforeSync: async () => {
    await indexBlocks();
  },
  beforeAll: (account, strategy) => {
    expect(account.balance.toFixed()).toBe(ethers.parseEther("10000").toString());
    expect(account.subAccounts?.[0].type).toBe("TokenAccount");
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(strategy === "legacy" ? 2 : 0);
  },
  afterAll: (account, strategy) => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.parseUnits("20", USDC_ON_POLYGON.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(0);
    expect(account.operations.length).toBe(strategy === "legacy" ? 7 : 3);
  },
  teardown: async () => {
    resetIndexer();
    await Promise.all([killSpeculos(), killAnvil()]);
  },
};
