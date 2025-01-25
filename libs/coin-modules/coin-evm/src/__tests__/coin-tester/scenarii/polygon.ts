import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, initMswHandlers, setBlock, indexBlocks } from "../indexer";
import { buildAccountBridge, buildCurrencyBridge } from "../../../bridge/js";
import { Transaction as EvmTransaction } from "../../../types";
import { getCoinConfig, setCoinConfig } from "../../../config";
import { makeAccount } from "../../fixtures/common.fixtures";
import { callMyDealer, polygon, VITALIK } from "../helpers";
import { defaultNanoApp } from "../scenarii.test";
import { killAnvil, spawnAnvil } from "../anvil";
import resolver from "../../../hw-getAddress";

type PolygonScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

const USDC_ON_POLYGON = getTokenById("polygon/erc20/usd_coin_(pos)");
const yootContract = "0x670fd103b1a08628e9557cD66B87DeD841115190";
const yootTokenId = "1988";
const emberContract = "0xa5511E9941E303101b50675926Fd4d9c1A8a8805";
const platinumTokenId = "4";

const makeScenarioTransactions = ({ address }: { address: string }) => {
  const send1MaticTransaction: PolygonScenarioTransaction = {
    name: "Send 1 POL",
    amount: new BigNumber(ethers.utils.parseEther("1").toString()),
    recipient: ethers.constants.AddressZero,
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
    amount: new BigNumber(
      ethers.utils.parseUnits("80", USDC_ON_POLYGON.units[0].magnitude).toString(),
    ),
    subAccountId: encodeTokenAccountId(`js:2:polygon:${address}:`, USDC_ON_POLYGON),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.utils.parseUnits("80", USDC_ON_POLYGON.units[0].magnitude).toString(),
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
    sendERC721Transaction,
    sendERC1155Transaction,
  ];
};

export const scenarioPolygon: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic Polygon Transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://rpc.ankr.com/polygon"),
    ]);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
    const signerContext: Parameters<typeof resolver>[0] = (deviceId, fn) => fn(new Eth(transport));

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    await setBlock(lastBlockNumber + 1);

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
      },
    }));
    initMswHandlers(getCoinConfig(polygon).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const currencyBridge = buildCurrencyBridge(signerContext);
    const accountBridge = buildAccountBridge(signerContext);
    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: polygon,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, polygon);

    await setBlock(lastBlockNumber + 1);

    // Send 100 USDC to the scenario account
    await callMyDealer({
      provider,
      drug: USDC_ON_POLYGON,
      junkie: address,
      dose: ethers.utils.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude),
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
      dose: ethers.BigNumber.from(1),
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
      dose: ethers.BigNumber.from(10),
    });

    return { currencyBridge, accountBridge, account: scenarioAccount, onSignerConfirmation };
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  beforeSync: async () => {
    await indexBlocks();
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.utils.parseEther("10000").toString());
    expect(account.subAccounts?.[0].type).toBe("TokenAccount");
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(2);
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("20", USDC_ON_POLYGON.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(0);
    expect(account.operations.length).toBe(7);
  },
  teardown: async () => {
    resetIndexer();
    await Promise.all([killSpeculos(), killAnvil()]);
  },
};
