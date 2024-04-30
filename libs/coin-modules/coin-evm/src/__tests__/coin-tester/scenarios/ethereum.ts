import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { buildAccountBridge, buildCurrencyBridge } from "../../../bridge/js";
import { makeAccount } from "../../fixtures/common.fixtures";
import { EvmNftTransaction, Transaction as EvmTransaction } from "../../../types";
import resolver from "../../../hw-getAddress";
import { setCoinConfig } from "../../../config";
import {
  ethereum,
  ERC20Interface,
  USDC_ON_ETHEREUM,
  ERC721Interface,
  ERC1155Interface,
  impersonnateAccount,
} from "../helpers";
import { clearExplorerAppendix, getLogs, setBlock } from "../indexer";
import { killAnvil, spawnAnvil } from "../anvil";

const makeScenarioTransactions = ({
  address,
}: {
  address: string;
}): ScenarioTransaction<EvmTransaction>[] => {
  const scenarioSendEthTransaction: ScenarioTransaction<EvmTransaction> = {
    name: "Send ethereum",
    amount: new BigNumber(100),
    recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(100).toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const scenarioSendUSDCTransaction: ScenarioTransaction<EvmTransaction> = {
    name: "Send USDC",
    amount: new BigNumber(
      ethers.utils.parseUnits("80", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
    ),
    recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
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

  const scenarioSendERC721Transaction: ScenarioTransaction<EvmTransaction & EvmNftTransaction> = {
    name: "Send ERC721",
    recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
    mode: "erc721",
    nft: {
      tokenId: "3368",
      contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      quantity: new BigNumber(1),
      collectionName: "Bored Ape",
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(
        currentAccount.nfts?.every(
          nft => nft.contract !== "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
        ),
      ).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
        tokenId: "3368",
        value: new BigNumber(1),
      });
    },
  };

  const scenarioSendERC1155Transaction: ScenarioTransaction<EvmTransaction & EvmNftTransaction> = {
    name: "Send ERC1155",
    recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
    mode: "erc1155",
    nft: {
      tokenId: "951",
      collectionName: "Clone X",
      contract: "0x348FC118bcC65a92dC033A951aF153d14D945312", // EIP55 checksum of 0x348fc118bcc65a92dc033a951af153d14d945312
      quantity: new BigNumber(2),
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(
        currentAccount.nfts?.every(
          nft => nft.contract !== "0x348FC118bcC65a92dC033A951aF153d14D945312",
        ),
      ).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: "0x348FC118bcC65a92dC033A951aF153d14D945312",
        tokenId: "951",
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

const defaultNanoApp = { firmware: "2.2.3" as const, version: "1.10.4" as const };

export const scenarioEthereum: Scenario<EvmTransaction> = {
  name: "Ledger Live Basic ETH Transactions",
  setup: async () => {
    const [{ transport, onSignerConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://rpc.ankr.com/eth"),
    ]);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
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

    const currencyBridge = buildCurrencyBridge(signerContext);
    const accountBridge = buildAccountBridge(signerContext);
    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: getCryptoCurrencyById("ethereum"),
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, ethereum);

    await setBlock();

    // Binance account
    await impersonnateAccount({
      provider,
      data: ERC20Interface.encodeFunctionData("transfer", [
        address,
        ethers.utils.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude),
      ]),
      to: USDC_ON_ETHEREUM.contractAddress,
      addressToImpersonnate: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // binance
    });

    // Bored Ape
    await impersonnateAccount({
      provider,
      data: ERC721Interface.encodeFunctionData("transferFrom", [
        "0x440Bcc7a1CF465EAFaBaE301D1D7739cbFe09dDA",
        address,
        "3368",
      ]),
      to: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      addressToImpersonnate: "0x440Bcc7a1CF465EAFaBaE301D1D7739cbFe09dDA",
    });

    // Clone X
    await impersonnateAccount({
      provider,
      data: ERC1155Interface.encodeFunctionData("safeTransferFrom", [
        "0xa3cd1123f4860C0cC512C775Ab6DB6A3E3d1B1Ee",
        address,
        "951",
        2,
        "0x",
      ]),
      to: "0x348fc118bcc65a92dc033a951af153d14d945312",
      addressToImpersonnate: "0xa3cd1123f4860C0cC512C775Ab6DB6A3E3d1B1Ee",
    });

    await getLogs();

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
  afterAll: account => {
    expect(account.subAccounts?.length).toBe(1);
    expect(account.subAccounts?.[0].balance.toFixed()).toBe(
      ethers.utils.parseUnits("20", USDC_ON_ETHEREUM.units[0].magnitude).toString(),
    );
    expect(account.nfts?.length).toBe(0);
    expect(account.operations.length).toBe(7);
  },
  teardown: async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
    clearExplorerAppendix();
  },
};
