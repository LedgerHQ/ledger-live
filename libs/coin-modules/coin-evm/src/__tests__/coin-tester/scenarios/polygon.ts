import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { buildAccountBridge, buildCurrencyBridge } from "../../../bridge/js";
import { makeAccount } from "../../fixtures/common.fixtures";
import { Transaction as EvmTransaction } from "../../../types";
import resolver from "../../../hw-getAddress";
import { setCoinConfig } from "../../../config";
import { ERC20Interface, USDC_ON_POLYGON, polygon } from "../helpers";
import { clearExplorerAppendix, getLogs, setBlock } from "../indexer";
import { killAnvil, spawnAnvil } from "../anvil";

const makeScenarioTransactions = ({ address }: { address: string }) => {
  const send1MaticTransaction: ScenarioTransaction<EvmTransaction> = {
    name: "Send 1 Matic",
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

  const send10MaticTransaction: ScenarioTransaction<EvmTransaction> = {
    name: "Send 10 Matic",
    amount: new BigNumber(ethers.utils.parseEther("10").toString()),
    recipient: ethers.constants.AddressZero,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(
        latestOperation.fee.plus(new BigNumber("10000000000000000000")).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const send100USDCTransaction: ScenarioTransaction<EvmTransaction> = {
    name: "Send 100 USDC",
    recipient: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // Random Receiver
    amount: new BigNumber(
      ethers.utils.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude).toString(),
    ),
    subAccountId: encodeTokenAccountId(`js:2:polygon:${address}:`, USDC_ON_POLYGON),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect(latestOperation.subOperations?.[0].type).toBe("OUT");
      expect(latestOperation.subOperations?.[0].value.toFixed()).toBe("100000000");
    },
  };

  return [send1MaticTransaction, send10MaticTransaction, send100USDCTransaction];
};

const initUSDCAccount = async (provider: ethers.providers.JsonRpcProvider, address: string) => {
  const addressToImpersonate = "0x45dDa9cb7c25131DF268515131f647d726f50608"; // Random owner of 8M USDC
  await provider.send("anvil_impersonateAccount", [addressToImpersonate]);

  const sendUSDC = {
    from: addressToImpersonate,
    to: USDC_ON_POLYGON.contractAddress,
    data: ERC20Interface.encodeFunctionData("transfer", [
      address,
      ethers.utils.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude),
    ]),
    value: ethers.BigNumber.from(0).toHexString(),
    gas: ethers.BigNumber.from(1_000_000).toHexString(),
    type: "0x0",
    gasPrice: (await provider.getGasPrice()).toHexString(),
    nonce: "0x" + (await provider.getTransactionCount(addressToImpersonate)).toString(16),
    chainId: "0x" + (await provider.getNetwork()).chainId.toString(16),
  };

  const hash = await provider.send("eth_sendTransaction", [sendUSDC]);
  await provider.send("anvil_stopImpersonatingAccount", [addressToImpersonate]);
  await provider.waitForTransaction(hash);
};

const defaultNanoApp = { firmware: "2.2.3" as const, version: "1.10.4" as const };

export const scenarioPolygon: Scenario<EvmTransaction> = {
  name: "Ledger Live Basic Polygon Transactions",
  setup: async () => {
    const [{ transport, onSignerConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`),
      spawnAnvil("https://rpc.ankr.com/polygon"),
    ]);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
    const signerContext: Parameters<typeof resolver>[0] = (deviceId, fn) => fn(new Eth(transport));

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

    const currencyBridge = buildCurrencyBridge(signerContext);
    const accountBridge = buildAccountBridge(signerContext);
    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/60'/0'/0/0",
      currency: getCryptoCurrencyById("polygon"),
      derivationMode: "",
    });

    const scenarioAccount = makeAccount(address, polygon);

    await setBlock();
    await initUSDCAccount(provider, address);

    await getLogs();

    return { currencyBridge, accountBridge, account: scenarioAccount, onSignerConfirmation };
  },
  getTransactions: address => makeScenarioTransactions({ address }),
  afterAll: account => {
    expect(account.operations.length).toBe(4);
  },
  teardown: async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
    clearExplorerAppendix();
  },
};
