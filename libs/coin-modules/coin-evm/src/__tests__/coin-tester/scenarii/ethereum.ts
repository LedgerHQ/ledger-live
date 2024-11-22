import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, indexBlocks, initMswHandlers, setBlock } from "../indexer";
import { EvmNftTransaction, Transaction as EvmTransaction } from "../../../types";
import { buildAccountBridge, buildCurrencyBridge } from "../../../bridge/js";
import { getCoinConfig, setCoinConfig } from "../../../config";
import { makeAccount } from "../../fixtures/common.fixtures";
import { ethereum, callMyDealer, VITALIK } from "../helpers";
import { defaultNanoApp } from "../scenarii.test";
import { killAnvil, spawnAnvil } from "../anvil";
import resolver from "../../../hw-getAddress";

type EthereumScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

const USDC_ON_ETHEREUM = getTokenById("ethereum/erc20/usd__coin");
const boredApeContract = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
const boredApeTokenId = "3368";
const cloneXContract = "0x348FC118bcC65a92dC033A951aF153d14D945312";
const cloneXTokenId = "951";

const makeScenarioTransactions = ({
  address,
}: {
  address: string;
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
    amount: new BigNumber(
      ethers.utils.parseUnits("80", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
    ),
    recipient: VITALIK,
    subAccountId: encodeTokenAccountId(`js:2:ethereum:${address}:`, USDC_ON_ETHEREUM),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe(
        ethers.utils.parseUnits("80", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
      );
      expect(currentAccount.subAccounts?.[0].balance.toFixed()).toBe(
        ethers.utils.parseUnits("20", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
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
    scenarioSendERC721Transaction,
    scenarioSendERC1155Transaction,
  ];
};

export const scenarioEthereum: Scenario<EvmTransaction, Account> = {
  name: "Ledger Live Basic ETH Transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://rpc.ankr.com/eth"),
    ]);

    const signerContext: Parameters<typeof resolver>[0] = (deviceId, fn) => fn(new Eth(transport));

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
      },
    }));

    initMswHandlers(getCoinConfig(ethereum).info);

    const onSignerConfirmation = getOnSpeculosConfirmation();
    const currencyBridge = buildCurrencyBridge(signerContext);
    const accountBridge = buildAccountBridge(signerContext);
    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: ethereum,
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, ethereum);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");

    const lastBlockNumber = await provider.getBlockNumber();
    // start indexing at next block
    await setBlock(lastBlockNumber + 1);

    // Get USDC
    await callMyDealer({
      provider,
      drug: USDC_ON_ETHEREUM,
      junkie: address,
      dose: ethers.utils.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude),
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
      dose: ethers.BigNumber.from(1),
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
      dose: ethers.BigNumber.from(2),
    });

    return {
      currencyBridge,
      accountBridge,
      account: scenarioAccount,
      onSignerConfirmation,
    };
  },
  beforeAll: account => {
    expect(account.balance.toFixed()).toBe(ethers.utils.parseEther("10000").toString());
    expect(account.subAccounts?.[0].type).toBe("TokenAccount");
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(2);
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  beforeSync: async () => {
    await indexBlocks();
  },
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("20", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(0);
    expect(account.operations.length).toBe(7);
  },
  teardown: async () => {
    resetIndexer();
    await Promise.all([killSpeculos(), killAnvil()]);
  },
};
