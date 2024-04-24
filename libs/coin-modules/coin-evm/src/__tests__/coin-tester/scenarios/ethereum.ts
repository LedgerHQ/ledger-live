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
} from "../helpers";
import { clearExplorerAppendix, getLogs, setBlock } from "../indexer";
import { killAnvil, spawnAnvil } from "../docker";

const scenarioSendTransaction: ScenarioTransaction<EvmTransaction> = {
  name: "Send ethereum",
  amount: new BigNumber(100),
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  expect: account => {
    const { operations } = account;
    const sendOperation = operations.find(operation => operation.transactionSequenceNumber === 0);
    expect(sendOperation?.transactionRaw?.amount === "100").toBeDefined();
  },
};

// use function createTransaction
const scenarioUSDCTransaction: ScenarioTransaction<EvmTransaction> = {
  name: "Send USDC",
  amount: new BigNumber(80),
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  subAccountId: encodeTokenAccountId(
    "js:2:ethereum:0x3313797c7B45F34c56Bdedc0179992A4d435AF25",
    USDC_ON_ETHEREUM,
  ),
  expect: account => {
    const { operations } = account;
    const sendOperation = operations.find(operation => operation.transactionSequenceNumber === 1);
    expect(sendOperation?.transactionRaw?.amount).toBe("80");
  },
};

const scenarioERC721Transaction: ScenarioTransaction<EvmTransaction & EvmNftTransaction> = {
  name: "Send ERC721",
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  mode: "erc721",
  nft: {
    tokenId: "3368",
    contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    quantity: new BigNumber(1),
    collectionName: "Bored Ape",
  },
  expect: account => {
    const sendOperation = account.operations.find(
      operation => operation.transactionSequenceNumber === 2,
    );

    expect(
      sendOperation?.nftOperations?.find(
        op => op.contract === "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      ),
    ).toBeDefined();
  },
};

const scenarioERC1155Transaction: ScenarioTransaction<EvmTransaction & EvmNftTransaction> = {
  name: "Send ERC1155",
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  mode: "erc1155",
  nft: {
    tokenId: "951",
    collectionName: "Clone X",
    contract: "0x348FC118bcC65a92dC033A951aF153d14D945312", // EIP55 checksum of 0x348fc118bcc65a92dc033a951af153d14d945312
    quantity: new BigNumber(2),
  },
  expect: account => {
    const sendOperation = account.operations.find(
      operation => operation.transactionSequenceNumber === 3,
    );
    expect(
      sendOperation?.nftOperations?.find(
        op => op.contract === "0x348FC118bcC65a92dC033A951aF153d14D945312",
      ),
    ).toBeDefined();
  },
};

const initUSDCAccount = async (provider: ethers.providers.JsonRpcProvider, address: string) => {
  // USDC
  const addressToImpersonateBinance = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503"; // Binance
  await provider.send("anvil_impersonateAccount", [addressToImpersonateBinance]);
  const sendUSDC = {
    from: addressToImpersonateBinance,
    to: USDC_ON_ETHEREUM.contractAddress,
    data: ERC20Interface.encodeFunctionData("transfer", [
      address,
      ethers.utils.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude),
    ]),
    value: ethers.BigNumber.from(0).toHexString(),
    gas: ethers.BigNumber.from(1_000_000).toHexString(),
    type: "0x0",
    gasPrice: (await provider.getGasPrice()).toHexString(),
    nonce: "0x" + (await provider.getTransactionCount(addressToImpersonateBinance)).toString(16),
    chainId: "0x" + (await provider.getNetwork()).chainId.toString(16),
  };

  const hash = await provider.send("eth_sendTransaction", [sendUSDC]);
  await provider.send("anvil_stopImpersonatingAccount", [addressToImpersonateBinance]);
  await provider.waitForTransaction(hash);
};

const initBoredApeAccount = async (provider: ethers.providers.JsonRpcProvider, address: string) => {
  // Bored Ape
  const addressToImpersonateBoredApe = "0x440Bcc7a1CF465EAFaBaE301D1D7739cbFe09dDA";
  await provider.send("anvil_impersonateAccount", [addressToImpersonateBoredApe]);
  const sendBoredApe = {
    from: addressToImpersonateBoredApe,
    to: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    data: ERC721Interface.encodeFunctionData("transferFrom", [
      addressToImpersonateBoredApe,
      address,
      "3368",
    ]),
    value: ethers.BigNumber.from(0).toHexString(),
    gas: ethers.BigNumber.from(1_000_000).toHexString(),
    type: "0x0",
    gasPrice: (await provider.getGasPrice()).toHexString(),
    nonce: "0x" + (await provider.getTransactionCount(addressToImpersonateBoredApe)).toString(16),
    chainId: "0x" + (await provider.getNetwork()).chainId.toString(16),
  };

  const boredApeTxHash = await provider.send("eth_sendTransaction", [sendBoredApe]);
  await provider.send("anvil_stopImpersonatingAccount", [addressToImpersonateBoredApe]);
  await provider.waitForTransaction(boredApeTxHash);
};

const initCloneXAccount = async (provider: ethers.providers.JsonRpcProvider, address: string) => {
  // send CloneX
  const addressToImpersonateCloneX = "0xa3cd1123f4860C0cC512C775Ab6DB6A3E3d1B1Ee";
  await provider.send("anvil_impersonateAccount", [addressToImpersonateCloneX]);
  const sendCloneX = {
    from: addressToImpersonateCloneX,
    to: "0x348fc118bcc65a92dc033a951af153d14d945312",
    data: ERC1155Interface.encodeFunctionData("safeTransferFrom", [
      addressToImpersonateCloneX,
      address,
      "951",
      2,
      "0x",
    ]),
    value: ethers.BigNumber.from(0).toHexString(),
    gas: ethers.BigNumber.from(1_000_000).toHexString(),
    type: "0x0",
    gasPrice: (await provider.getGasPrice()).toHexString(),
    nonce: "0x" + (await provider.getTransactionCount(addressToImpersonateCloneX)).toString(16),
    chainId: "0x" + (await provider.getNetwork()).chainId.toString(16),
  };

  const cloneXTxHash = await provider.send("eth_sendTransaction", [sendCloneX]);
  await provider.send("anvil_stopImpersonatingAccount", [addressToImpersonateCloneX]);
  await provider.waitForTransaction(cloneXTxHash);
};

const defaultNanoApp = { firmware: "2.2.3" as const, version: "1.10.4" as const };

export const scenarioEthereum: Scenario<EvmTransaction> = {
  name: "Ledger Live Basic ETH Transactions",
  setup: async () => {
    const [{ transport, onSignerConfirmation }] = await Promise.all([
      spawnSpeculos(
        "speculos",
        `/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`,
      ),
      spawnAnvil("https://rpc.ankr.com/eth"),
    ]);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
    const signerContext = (deviceId: string, fn: any): any => fn(new Eth(transport));

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

    await initUSDCAccount(provider, address);
    await initBoredApeAccount(provider, address);
    await initCloneXAccount(provider, address);

    await getLogs();

    return { currencyBridge, accountBridge, account: scenarioAccount, onSignerConfirmation };
  },
  beforeAll: account => {
    expect(account.nfts?.length).toBe(2);
  },
  transactions: [
    scenarioSendTransaction,
    scenarioUSDCTransaction,
    scenarioERC721Transaction,
    scenarioERC1155Transaction,
  ],
  afterAll: account => {
    expect(account.operations.filter(operation => operation.type === "OUT").length).toBe(2);
    expect(
      account.operations
        .filter(operation => operation.type === "FEES")
        .filter(
          feesOperations =>
            feesOperations.nftOperations?.find(nftOperation => nftOperation.type === "NFT_OUT"),
        ).length,
    ).toBe(2);
  },
  teardown: async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
    clearExplorerAppendix();
  },
};
