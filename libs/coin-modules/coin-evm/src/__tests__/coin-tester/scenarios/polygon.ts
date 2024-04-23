import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { ethers, providers } from "ethers";
import { killSpeculos, spawnSigner } from "@ledgerhq/coin-tester/docker";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { Scenario } from "@ledgerhq/coin-tester/main";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { buildAccountBridge, buildCurrencyBridge } from "../../../bridge/js";
import { makeAccount } from "../../fixtures/common.fixtures";
import { Transaction as EvmTransaction } from "../../../types";
import resolver from "../../../hw-getAddress";
import { setCoinConfig } from "../../../config";
import { ERC20Interface, USDC_ON_POLYGON, polygon } from "../helpers";
import { clearExplorerAppendix, getLogs, setBlock } from "../indexer";
import { killAnvil, spawnAnvil } from "../docker";

const defaultNanoApp = { firmware: "2.2.3" as const, version: "1.10.4" as const };

export const scenarioPolygon: Scenario<EvmTransaction> = {
  name: "Ledger Live Basic Polygon Transactions",
  setup: async () => {
    const [{ transport, onSignerConfirmation }] = await Promise.all([
      spawnSigner(
        "speculos",
        `/${defaultNanoApp.firmware}/Ethereum/app_${defaultNanoApp.version}.elf`,
      ),
      spawnAnvil("https://rpc.ankr.com/polygon"),
    ]);

    const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
    const signerContext = (deviceId: string, fn: any): any => fn(new Eth(transport));

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
    await getLogs();

    return { currencyBridge, accountBridge, account: scenarioAccount, onSignerConfirmation };
  },
  transactions: [
    {
      name: "Send 1 Matic",
      amount: new BigNumber(ethers.utils.parseEther("1").toString()),
      recipient: ethers.constants.AddressZero,
      expect: account => {
        expect(
          account.operations.find(operation => operation.transactionSequenceNumber === 0)
            ?.transactionRaw?.amount,
        ).toBe("1000000000000000000");
      },
    },
    {
      name: "Send 10 Matic",
      amount: new BigNumber(ethers.utils.parseEther("10").toString()),
      recipient: ethers.constants.AddressZero,
      expect: account => {
        expect(
          account.operations.find(operation => operation.transactionSequenceNumber === 1)
            ?.transactionRaw?.amount,
        ).toBe("10000000000000000000");
      },
    },
    {
      name: "Send 100 USDC",
      recipient: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // Random Receiver
      amount: new BigNumber(
        ethers.utils.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude).toString(),
      ),
      subAccountId: encodeTokenAccountId(
        "js:2:polygon:0x2FBde3Ac8F867e5ED06e4C7060d0df00D87E2C35:",
        USDC_ON_POLYGON,
      ),
      expect: account => {
        expect(
          account.operations.find(operation => operation.transactionSequenceNumber === 2)
            ?.transactionRaw?.amount,
        ).toBe("100000000");
      },
    },
  ],
  afterAll: account => {
    expect(account.operations.filter(operation => operation.type === "OUT").length).toBe(3);
  },
  teardown: async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
    clearExplorerAppendix();
  },
};
