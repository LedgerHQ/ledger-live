import * as fs from "fs";
import * as path from "path";
import { ethers, HDNodeWallet } from "ethers";
import { mnemonicToSeed } from "bip39";
import { callMyDealer } from "./helpers";
import { killAnvil, spawnAnvilFork } from "./anvil";
import { COIN_TESTER_EVM_MNEMONIC } from "./signer";
import {
  USDC_ON_ETHEREUM,
  USDC_ON_POLYGON,
  USDT_ON_BNB,
  MIM_ON_BLAST,
  USDC_ON_SCROLL,
  BRIDGED_USDC_ON_SONIC as USDC_ON_SONIC,
} from "./tokenFixtures";
import "./tokenFixtures";

global.console = require("console");
jest.setTimeout(600_000);

const STATE_DIR = path.join(__dirname, "..", "state");

async function deriveTestAddress(): Promise<string> {
  const seed = await mnemonicToSeed(COIN_TESTER_EVM_MNEMONIC);
  const root = HDNodeWallet.fromSeed(`0x${seed.toString("hex")}`);
  return root.derivePath("44'/60'/0'/0/0").address;
}

type ChainConfig = {
  name: string;
  rpc: string;
  forkBlockNumber?: number;
  setup?: (provider: ethers.JsonRpcProvider, address: string) => Promise<void>;
};

const chains: ChainConfig[] = [
  {
    name: "ethereum",
    rpc: "https://ethereum-rpc.publicnode.com",
    setup: async (provider, address) => {
      await callMyDealer({
        provider,
        drug: USDC_ON_ETHEREUM,
        junkie: address,
        dose: ethers.parseUnits("100", USDC_ON_ETHEREUM.units[0].magnitude),
      });
    },
  },
  {
    name: "polygon",
    rpc: "https://polygon-bor-rpc.publicnode.com",
    setup: async (provider, address) => {
      await callMyDealer({
        provider,
        drug: USDC_ON_POLYGON,
        junkie: address,
        dose: ethers.parseUnits("100", USDC_ON_POLYGON.units[0].magnitude),
      });
    },
  },
  {
    name: "bnb",
    rpc: "https://bsc-rpc.publicnode.com",
    setup: async (provider, address) => {
      await callMyDealer({
        provider,
        drug: USDT_ON_BNB,
        junkie: address,
        dose: ethers.parseUnits("100", USDT_ON_BNB.units[0].magnitude),
      });
    },
  },
  {
    name: "base",
    rpc: "https://mainnet.base.org",
    // 2797222 = deployment block of USDC on Base + 1
    forkBlockNumber: 2797222,
  },
  {
    name: "blast",
    rpc: "https://rpc.blast.io",
    setup: async (provider, address) => {
      await callMyDealer({
        provider,
        drug: MIM_ON_BLAST,
        junkie: address,
        dose: ethers.parseUnits("100", MIM_ON_BLAST.units[0].magnitude),
      });
    },
  },
  {
    name: "scroll",
    rpc: "https://rpc.scroll.io",
    setup: async (provider, address) => {
      await callMyDealer({
        provider,
        drug: USDC_ON_SCROLL,
        junkie: address,
        dose: ethers.parseUnits("100", USDC_ON_SCROLL.units[0].magnitude),
      });
    },
  },
  {
    name: "sonic",
    rpc: "https://sonic-rpc.publicnode.com",
    setup: async (provider, address) => {
      await callMyDealer({
        provider,
        drug: USDC_ON_SONIC,
        junkie: address,
        dose: ethers.parseUnits("100", USDC_ON_SONIC.units[0].magnitude),
      });
    },
  },
  {
    name: "core",
    rpc: "https://rpc.ankr.com/core",
  },
  {
    name: "arc_testnet",
    rpc: "https://rpc.testnet.arc.network",
  },
  {
    name: "robinhood_testnet",
    rpc: "https://rpc.testnet.chain.robinhood.com",
  },
];

describe("EVM State Dump", () => {
  let testAddress: string;

  beforeAll(async () => {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    testAddress = await deriveTestAddress();
  });

  for (const chain of chains) {
    it(`dump ${chain.name}`, async () => {
      try {
        await spawnAnvilFork(chain.rpc, chain.forkBlockNumber);
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

        if (chain.setup) {
          await chain.setup(provider, testAddress);
        }

        const state: string = await provider.send("anvil_dumpState", []);
        fs.writeFileSync(path.join(STATE_DIR, `${chain.name}.json`), state);
      } finally {
        await killAnvil();
      }
    });
  }
});
