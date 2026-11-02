import { cryptoWaitReady } from "@polkadot/util-crypto";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import type { PolkadotCoinConfig, PolkadotContext } from "@ledgerhq/coin-polkadot/config";
import { createBridges } from "@ledgerhq/coin-polkadot/bridge/index";
import { makeAccount } from "../fixtures";
import { polkadot } from "../helpers";
import {
  endpointOf,
  fundFromAlice,
  startPolkadotSandbox,
  toWs,
  atlasOf,
  waitForInclusion,
} from "../sandbox";
import resolver from "@ledgerhq/coin-polkadot/signer/index";
import {
  PolkadotAccount,
  Transaction as PolkadotTransaction,
} from "@ledgerhq/coin-polkadot/types/bridge";
import { buildSigner } from "../signer";

type PolkadotScenarioTransaction = ScenarioTransaction<PolkadotTransaction, PolkadotAccount>;

const getTransactions = () => {
  const send1DotTransaction: PolkadotScenarioTransaction = {
    name: "Send 1 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(polkadot.units[0], "1"),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(
        latestOperation.fee.plus(parseCurrencyUnit(polkadot.units[0], "1")).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const send100DotTransaction: PolkadotScenarioTransaction = {
    name: "Send 100 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(polkadot.units[0], "100"),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(
        latestOperation.fee.plus(parseCurrencyUnit(polkadot.units[0], "100")).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const sendAllDotTransaction: PolkadotScenarioTransaction = {
    name: "Send all DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(polkadot.units[0], "0"),
    mode: "send",
    useAllAmount: true,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.extra).toMatchObject({
        palletMethod: "balances.transferAll",
      });
      expect(latestOperation.senders).toStrictEqual([previousAccount.freshAddress]);
      expect(latestOperation.recipients).toStrictEqual([
        "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
      ]);
    },
  };

  return [send1DotTransaction, send100DotTransaction, sendAllDotTransaction];
};

/** DOT sent to the scenario's account, whole units. */
const ACCOUNT_DOT = "100000";

let sandbox: Sandbox | undefined;
let api: ApiPromise | undefined;
let closeGuard: (() => void) | undefined;
let coinConfig: PolkadotCoinConfig;
let atlas: ReturnType<typeof atlasOf>;

const context: PolkadotContext = {
  config: async () => coinConfig,
  logger: () => {},
};

export const PolkadotScenario: Scenario<PolkadotTransaction, PolkadotAccount> = {
  name: "Polkadot Ledger Live transactions",

  setup: async () => {
    closeGuard = forbidRemoteRequests();
    sandbox = await startPolkadotSandbox();
    const nodeUrl = endpointOf(sandbox, "relay");
    const node = toWs(nodeUrl);

    // Production's layout: the rest-api serves the relay chain under `/v1/rc`, Atlas under its own path
    coinConfig = {
      status: {
        type: "active",
      },
      name: "Polkadot",
      unit: { name: "DOT", code: "DOT", magnitude: 10 },
      // HTTP like production: a WebSocket would keep reconnecting after the teardown
      node: { url: nodeUrl },
      indexer: { url: `${endpointOf(sandbox, "relayIndexer")}/blockchain/dot` },
      sidecar: { url: `${endpointOf(sandbox, "restApi")}/v1/rc` },
    };

    atlas = atlasOf(coinConfig.indexer.url);

    await cryptoWaitReady();
    api = await ApiPromise.create({
      provider: new WsProvider(node) as ProviderInterface,
      noInitWarn: true,
    });

    const signer = await buildSigner();
    const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(signer);

    const { accountBridge, currencyBridge } = createBridges(signerContext, context);

    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/354'/0'/0'/0'",
      currency: polkadot,
      derivationMode: "polkadotbip44",
    });

    const keyring = new Keyring({ type: "sr25519" });
    keyring.setSS58Format(0);
    const polkadotScenarioAccountPair = keyring.addFromAddress(address, {
      name: "BASIC_SCENARIO_ACCOUNT",
    });

    // The sandbox's airdrop funds Asset Hub: the relay chain's account is funded by Alice
    await fundFromAlice(
      api,
      polkadotScenarioAccountPair.address,
      BigInt(parseCurrencyUnit(polkadot.units[0], ACCOUNT_DOT).toFixed()),
    );

    await atlas.waitForBlock((await api.rpc.chain.getHeader()).number.toNumber());

    const account = makeAccount(polkadotScenarioAccountPair.address, polkadot);

    return {
      accountBridge,
      currencyBridge,
      address: polkadotScenarioAccountPair.address,
      account,
    };
  },
  getTransactions,
  beforeAll: async account => {
    expect(formatCurrencyUnit(polkadot.units[0], account.balance, { useGrouping: false })).toBe(
      ACCOUNT_DOT,
    );
  },
  // Atlas has indexed the block of the transaction before the tester asserts on it
  mockIndexer: async (_account, optimistic) => {
    const block = await waitForInclusion(api!, optimistic.hash);
    await atlas.waitForBlock(block);
  },
  teardown: async () => {
    await api?.disconnect();
    api = undefined;
    closeGuard?.();
    closeGuard = undefined;
    await sandbox?.down();
    sandbox = undefined;
  },
};
