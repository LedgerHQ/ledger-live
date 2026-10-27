import "@polkadot/api/augment";
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
import { assethub } from "../helpers";
import {
  claimableEra,
  endpointOf,
  startPolkadotSandbox,
  toWs,
  atlasOf,
  waitForInclusion,
  waitForUnlock,
} from "../sandbox";
import resolver from "@ledgerhq/coin-polkadot/signer/index";
import {
  PolkadotAccount,
  PolkadotOperationExtra,
  Transaction as PolkadotTransaction,
} from "@ledgerhq/coin-polkadot/types/bridge";
import { buildSigner } from "../signer";

// The transaction that waits for the era in which the unbonded funds can be withdrawn
const WITHDRAW_NAME = "Withdraw 50 DOT";

type PolkadotScenarioTransaction = ScenarioTransaction<PolkadotTransaction, PolkadotAccount>;

let claimRewardEra: string | null = null;
let claimRewardValidators: string[] | null = null;
// Validators of the chain: the mainnet ones the scenario used on a fork do not exist on a sandbox
let nominateValidators: string[] = [];

const getTransactions = () => {
  const send1DotTransaction: PolkadotScenarioTransaction = {
    name: "Send 1 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(assethub.units[0], "1"),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(
        latestOperation.fee.plus(parseCurrencyUnit(assethub.units[0], "1")).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const send100DotTransaction: PolkadotScenarioTransaction = {
    name: "Send 100 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(assethub.units[0], "100"),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(
        latestOperation.fee.plus(parseCurrencyUnit(assethub.units[0], "100")).toFixed(),
      );
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const bond500DotTransaction: PolkadotScenarioTransaction = {
    name: "Bond 500 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(assethub.units[0], "500"),
    mode: "bond",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("BOND");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe("staking.bond");
      expect(
        parseCurrencyUnit(
          assethub.units[0],
          (latestOperation.extra as PolkadotOperationExtra).bondedAmount!.toFixed(),
        ).toFixed(),
      ).toBe("50000000000000000000000");
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const unbond100DotTransaction: PolkadotScenarioTransaction = {
    name: "Unbond 100 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(assethub.units[0], "100"),
    mode: "unbond",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("UNBOND");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe("staking.unbond");
      expect(
        parseCurrencyUnit(
          assethub.units[0],
          (latestOperation.extra as PolkadotOperationExtra).unbondedAmount!.toFixed(),
        ).toFixed(),
      ).toBe("10000000000000000000000");
      expect(
        parseCurrencyUnit(
          assethub.units[0],
          currentAccount.polkadotResources.unlockingBalance.toFixed(),
        ).toFixed(),
      ).toBe("10000000000000000000000");
    },
  };

  const rebond50DotTransaction: PolkadotScenarioTransaction = {
    name: "Rebond 50 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(assethub.units[0], "50"),
    mode: "rebond",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("BOND");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe("staking.rebond");
      expect(
        parseCurrencyUnit(
          assethub.units[0],
          (latestOperation.extra as PolkadotOperationExtra).bondedAmount!.toFixed(),
        ).toFixed(),
      ).toBe("5000000000000000000000"); // Should be 450 DOT no ?
      expect(
        parseCurrencyUnit(
          assethub.units[0],
          currentAccount.polkadotResources.unlockingBalance.toFixed(),
        ).toFixed(),
      ).toBe("5000000000000000000000");
    },
  };

  const nomminateTransaction: PolkadotScenarioTransaction = {
    name: "Nominate",
    mode: "nominate",
    validators: nominateValidators,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("NOMINATE");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe(
        "staking.nominate",
      );
      expect((latestOperation.extra as PolkadotOperationExtra).validators?.length).toBe(2);
      expect(currentAccount.polkadotResources.nominations?.length).toBe(2);
      expect(
        currentAccount.polkadotResources.nominations?.every(
          nominiation => nominiation.status === "waiting" || nominiation.status === "inactive",
        ),
      ).toBe(true);
    },
  };

  const chillTransaction: PolkadotScenarioTransaction = {
    name: "Chill",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    mode: "chill",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("CHILL");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe("staking.chill");
    },
  };

  const withdraw250DotTransaction: PolkadotScenarioTransaction = {
    name: WITHDRAW_NAME,
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    // What the rebond left unbonding: 100 were unbonded, 50 bonded again
    amount: parseCurrencyUnit(assethub.units[0], "50"),
    mode: "withdrawUnbonded",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("WITHDRAW_UNBONDED");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe(
        "staking.withdrawUnbonded",
      );
    },
  };

  const claimRewardTransaction: PolkadotScenarioTransaction = {
    name: "Claim reward",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    mode: "claimReward",
    era: claimRewardEra,
    validators: claimRewardValidators ?? [],
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe(
        "staking.payoutStakers",
      );
    },
  };

  const sendAllDotTransaction: PolkadotScenarioTransaction = {
    name: "Send all DOT that isn't bound",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(assethub.units[0], "0"),
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
      expect(currentAccount.balance.toFixed()).toBe("4500100000000");
    },
  };

  return [
    send1DotTransaction,
    send100DotTransaction,
    bond500DotTransaction,
    unbond100DotTransaction,
    rebond50DotTransaction,
    nomminateTransaction,
    chillTransaction,
    withdraw250DotTransaction,
    claimRewardTransaction,
    sendAllDotTransaction,
  ];
};

/** DOT airdropped to the scenario's account, whole units. */
const ACCOUNT_DOT = 100_000;

let sandbox: Sandbox | undefined;
let api: ApiPromise | undefined;
let closeGuard: (() => void) | undefined;
let coinConfig: PolkadotCoinConfig;
let atlas: ReturnType<typeof atlasOf>;
// The order the transactions run in, to wait for an era before the withdrawal
let transactionNames: string[] = [];
let transactionIndex = 0;

const context: PolkadotContext = {
  config: async () => coinConfig,
  logger: () => {},
};

export const AssetHubScenario: Scenario<PolkadotTransaction, PolkadotAccount> = {
  name: "Polkadot AssetHub Ledger Live transactions",

  setup: async () => {
    closeGuard = forbidRemoteRequests();
    sandbox = await startPolkadotSandbox();
    const nodeUrl = endpointOf(sandbox, "node");
    const node = toWs(nodeUrl);

    // Production's layout: the rest-api serves Asset Hub under `/v1`, Atlas under its own path
    coinConfig = {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      name: "Polkadot",
      unit: { name: "DOT", code: "DOT", magnitude: 10 },
      // HTTP like production: a WebSocket would keep reconnecting after the teardown
      node: { url: nodeUrl },
      indexer: { url: `${endpointOf(sandbox, "indexer")}/blockchain/dot_asset_hub` },
      sidecar: { url: `${endpointOf(sandbox, "restApi")}/v1` },
      hasBeenMigrated: true,
    };

    atlas = atlasOf(coinConfig.indexer.url);

    await cryptoWaitReady();
    api = await ApiPromise.create({
      provider: new WsProvider(node) as ProviderInterface,
      noInitWarn: true,
    });

    // The eras pass on their own: wait for one that has validators and can be claimed
    const claim = await claimableEra(api);
    claimRewardEra = String(claim.era);
    claimRewardValidators = [claim.validators[0]];
    nominateValidators = claim.validators.slice(0, 2);
    transactionNames = getTransactions().map(transaction => transaction.name);
    transactionIndex = 0;

    const signer = await buildSigner();
    const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(signer);

    const { accountBridge, currencyBridge } = createBridges(signerContext, context);

    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/354'/0'/0'/0'",
      currency: assethub,
      derivationMode: "polkadotbip44",
    });

    const keyring = new Keyring({ type: "sr25519" });
    keyring.setSS58Format(0);
    const polkadotScenarioAccountPair = keyring.addFromAddress(address, {
      name: "BASIC_SCENARIO_ACCOUNT",
    });

    await sandbox.airdrop(polkadotScenarioAccountPair.address, ACCOUNT_DOT);
    await atlas.waitForBlock((await api.rpc.chain.getHeader()).number.toNumber());

    const account = makeAccount(polkadotScenarioAccountPair.address, assethub);

    return {
      accountBridge,
      currencyBridge,
      address: polkadotScenarioAccountPair.address,
      account,
    };
  },
  getTransactions,
  beforeAll: async account => {
    expect(formatCurrencyUnit(assethub.units[0], account.balance, { useGrouping: false })).toBe(
      String(ACCOUNT_DOT),
    );
  },
  beforeEach: async account => {
    // The unbonded funds can be withdrawn two eras after the unbonding
    if (transactionNames[transactionIndex++] === WITHDRAW_NAME && api) {
      await waitForUnlock(api, account.freshAddress);
    }
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
