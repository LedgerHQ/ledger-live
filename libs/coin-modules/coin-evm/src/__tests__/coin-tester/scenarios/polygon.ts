import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { resetIndexer, initMswHandlers, setBlock, indexBlocks } from "../indexer";
import { buildAccountBridge, buildCurrencyBridge } from "../../../bridge/js";
import { Transaction as EvmTransaction } from "../../../types";
import { getCoinConfig, setCoinConfig } from "../../../config";
import { makeAccount } from "../../fixtures/common.fixtures";
import { defaultNanoApp } from "../scenarios.test";
import { killAnvil, spawnAnvil } from "../anvil";
import resolver from "../../../hw-getAddress";
import {
  ERC1155Interface,
  ERC20Interface,
  ERC721Interface,
  USDC_ON_POLYGON,
  impersonnateAccount,
  polygon,
} from "../helpers";

type PolygonScenarioTransaction = ScenarioTransaction<EvmTransaction, Account>;

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
    recipient: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // Random Receiver
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
    recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
    mode: "erc721",
    nft: {
      tokenId: "60528792147736380591631075209254468696410877323158186238633641510210472247297",
      contract: "0x897B7A466905A7F0390ebCFf195F227f9DC2244c",
      quantity: new BigNumber(1),
      collectionName: "Random Shit",
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(
        currentAccount.nfts?.every(
          nft => nft.contract !== "0x897B7A466905A7F0390ebCFf195F227f9DC2244c",
        ),
      ).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: "0x897B7A466905A7F0390ebCFf195F227f9DC2244c",
        tokenId: "60528792147736380591631075209254468696410877323158186238633641510210472247297",
        value: new BigNumber(1),
      });
    },
  };

  const sendERC1155Transaction: PolygonScenarioTransaction = {
    name: "Send ERC1155",
    recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
    mode: "erc1155",
    nft: {
      tokenId: "60528792147736380591631075209254468696410877323158186238633641510210472247298",
      contract: "0x631EAEd1388D1ac5A46e327f3A893c19b4d48920",
      quantity: new BigNumber(10),
      collectionName: "Random Shit 1155",
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(
        currentAccount.nfts?.every(
          nft => nft.contract !== "0x631EAEd1388D1ac5A46e327f3A893c19b4d48920",
        ),
      ).toBe(true);
      expect(latestOperation.type).toBe("FEES");
      const lastNftOperation = latestOperation.nftOperations?.[0];
      expect(lastNftOperation).toMatchObject({
        contract: "0x631EAEd1388D1ac5A46e327f3A893c19b4d48920",
        tokenId: "60528792147736380591631075209254468696410877323158186238633641510210472247298",
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
      currency: getCryptoCurrencyById("polygon"),
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, polygon);

    await setBlock(lastBlockNumber + 1);

    // Send 100 USDC to the scenario account
    await impersonnateAccount({
      provider,
      to: USDC_ON_POLYGON.contractAddress,
      data: ERC20Interface.encodeFunctionData("transfer", [
        address,
        ethers.utils.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude),
      ]),
      addressToImpersonnate: "0x45dDa9cb7c25131DF268515131f647d726f50608",
    });

    // Send 1 ERC721 to the scenario account
    await impersonnateAccount({
      provider,
      to: "0x897B7A466905A7F0390ebCFf195F227f9DC2244c",
      data: ERC721Interface.encodeFunctionData("transferFrom", [
        "0x85d2151147d8347aac0a8cd07bb6cc363fcf88e1",
        address,
        "60528792147736380591631075209254468696410877323158186238633641510210472247297",
      ]),
      addressToImpersonnate: "0x85d2151147d8347aac0a8cd07bb6cc363fcf88e1",
    });

    // Send 10 ERC1155 to the scenario account
    await impersonnateAccount({
      provider,
      to: "0x631EAEd1388D1ac5A46e327f3A893c19b4d48920",
      data: ERC1155Interface.encodeFunctionData("safeTransferFrom", [
        "0x85d2151147d8347aac0a8cd07bb6cc363fcf88e1",
        address,
        "60528792147736380591631075209254468696410877323158186238633641510210472247298",
        10,
        "0x",
      ]),
      addressToImpersonnate: "0x85d2151147d8347aac0a8cd07bb6cc363fcf88e1",
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
