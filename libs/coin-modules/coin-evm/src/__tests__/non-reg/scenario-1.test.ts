import "dotenv/config";
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
// import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  provider,
  ethereum,
  // polygon,
  ERC20Interface,
  USDC_ON_ETHEREUM,
  // USDC_ON_POLYGON,
} from "./helpers";
import { clearExplorerAppendix, getLogs, setBlock } from "./indexer";
import { executeScenario, Scenario } from "@ledgerhq/coin-tester/main";
import { killDocker, spawnSpeculos } from "@ledgerhq/coin-tester/docker";
import { makeAccount } from "../fixtures/common.fixtures";
import { Transaction as EvmTransaction } from "../../types";
import Eth from "@ledgerhq/hw-app-eth";
import resolver from "../../hw-getAddress";
import { buildAccountBridge, buildCurrencyBridge } from "../../bridge/js";

const scnerioAccount = makeAccount("0xlol", ethereum);
const scenarioTransction: EvmTransaction = Object.freeze({
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  feesStrategy: "medium",
  family: "evm",
  mode: "send",
  gasPrice: new BigNumber(0),
  gasLimit: new BigNumber(21000),
  nonce: 0,
  chainId: 1,
});

const defaultNanoAppVersion = { firmware: "2.1.0" as const, version: "1.10.3" as const };
const scenarioEthereum: Scenario<EvmTransaction> = {
  setup: async () => {
    const signerContext = (deviceId: string, fn: any): any => fn(new Eth(transport));
    const currencyBridge = buildCurrencyBridge(signerContext);
    const accountBridge = buildAccountBridge(signerContext);
    const transport = await spawnSpeculos(
      "speculos",
      `/${defaultNanoAppVersion.firmware}/Ethereum/app_${defaultNanoAppVersion.version}.elf`,
    );
    const getAddress = resolver(signerContext);

    return { currencyBridge, accountBridge, account: scnerioAccount, transport, getAddress };
  },
  beforeAll: async () => {
    await setBlock();

    const addressToImpersonate = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503"; // Binance
    await provider.send("anvil_impersonateAccount", [addressToImpersonate]);

    const sendUSDC = {
      from: addressToImpersonate,
      to: USDC_ON_ETHEREUM.contractAddress,
      data: ERC20Interface.encodeFunctionData("transfer", [
        "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
        ethers.utils.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude),
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
  },
  transactions: [scenarioTransction],
  afterAll: async () => {
    console.log("Done testing this scenario");
    await killDocker();
  },
};

/*
const scenarioPolygon: Scenario = {
  currency: {
    ...polygon,
    ethereumLikeInfo: {
      ...polygon.ethereumLikeInfo,
      node: {
        type: "external",
        uri: "http://127.0.0.1:8545",
      },
    } as EthereumLikeInfo,
  },
  rpc: "https://rpc.ankr.com/polygon",
  nanoApp: { firmware: "2.1.0", version: "1.10.3" },
  beforeTransactions: async (address: string) => {
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
  },
  transactions: [
    {
      amount: new BigNumber(ethers.utils.parseEther("1").toString()),
      recipient: ethers.constants.AddressZero,
    },
    {
      amount: new BigNumber(ethers.utils.parseEther("10").toString()),
      recipient: ethers.constants.AddressZero,
    },
    {
      recipient: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", // Random Receiver
      amount: new BigNumber(
        ethers.utils.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude).toString(),
      ),
      subAccountId: encodeTokenAccountId(
        "js:2:polygon:0x2FBde3Ac8F867e5ED06e4C7060d0df00D87E2C35:",
        USDC_ON_POLYGON,
      ),
    },
  ],
};
*/

jest.setTimeout(60_000); // 10 Min

describe("EVM Deterministic Tester", () => {
  const jestConsole = console;

  beforeEach(() => {
    global.console = require("console");
  });

  afterEach(() => {
    global.console = jestConsole;
    clearExplorerAppendix();
  });

  // afterEach(async () => {
  //   await killDocker();
  // });

  it("should send ETH & USDC on Ethereum", async () => {
    try {
      await executeScenario(scenarioEthereum);
    } catch (e) {
      if (e != "done") {
        throw e;
      }
    }
  });

  /*
  it("should send MATIC & USDC on Polygon", async () => {
      try {
          await executeScenario(scenarioPolygon);
        } catch (e) {
            if (e != "done") {
                throw e;
            }
        }
    });
   */
});
