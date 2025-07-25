import BigNumber from "bignumber.js";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { killChopsticksAndSidecar, spawnChopsticksAndSidecar } from "../chopsticks-sidecar";
import { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import { ExplorerExtrinsic } from "@ledgerhq/coin-polkadot";
import { defaultNanoApp } from "../scenarii.test";
import { createBridges } from "@ledgerhq/coin-polkadot/bridge/index";
import { makeAccount } from "../fixtures";
import { indexOperation } from "../indexer";
import { polkadot } from "../helpers";
import resolver from "@ledgerhq/coin-polkadot/signer/index";
import {
  PolkadotAccount,
  PolkadotOperationExtra,
  Transaction as PolkadotTransaction,
} from "@ledgerhq/coin-polkadot/types/bridge";

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

  const bond500DotTransaction: PolkadotScenarioTransaction = {
    name: "Bond 500 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(polkadot.units[0], "500"),
    mode: "bond",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("BOND");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe("staking.bond");
      expect(
        parseCurrencyUnit(
          polkadot.units[0],
          (latestOperation.extra as PolkadotOperationExtra).bondedAmount!.toFixed(),
        ).toFixed(),
      ).toBe("50000000000000000000000");
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance
          .minus(latestOperation.value)
          .minus(new BigNumber("5000000000000"))
          .toFixed(),
      );
    },
  };

  const unbond100DotTransaction: PolkadotScenarioTransaction = {
    name: "Unbond 100 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(polkadot.units[0], "100"),
    mode: "unbond",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("UNBOND");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe("staking.unbond");
      expect(
        parseCurrencyUnit(
          polkadot.units[0],
          (latestOperation.extra as PolkadotOperationExtra).unbondedAmount!.toFixed(),
        ).toFixed(),
      ).toBe("10000000000000000000000");
      expect(
        parseCurrencyUnit(
          polkadot.units[0],
          currentAccount.polkadotResources.unlockingBalance.toFixed(),
        ).toFixed(),
      ).toBe("10000000000000000000000");
    },
  };

  const rebond50DotTransaction: PolkadotScenarioTransaction = {
    name: "Rebond 50 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(polkadot.units[0], "50"),
    mode: "rebond",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("BOND");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe("staking.rebond");
      expect(
        parseCurrencyUnit(
          polkadot.units[0],
          (latestOperation.extra as PolkadotOperationExtra).bondedAmount!.toFixed(),
        ).toFixed(),
      ).toBe("5000000000000000000000"); // Should be 450 DOT no ?
      expect(
        parseCurrencyUnit(
          polkadot.units[0],
          currentAccount.polkadotResources.unlockingBalance.toFixed(),
        ).toFixed(),
      ).toBe("5000000000000000000000");
    },
  };

  const nomminateTransaction: PolkadotScenarioTransaction = {
    name: "Nominate",
    mode: "nominate",
    // https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fpolkadot-rpc.publicnode.com#/staking
    validators: [
      "15ANfaUMadXk65NtRqzCKuhAiVSA47Ks6fZs8rUcRQX11pzM",
      "19KaPfHSSjv4soqNW1tqPMwAnSGmG3pGydPzrPvaNLXLFDZ",
    ],
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
    name: "Withdraw 250 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: parseCurrencyUnit(polkadot.units[0], "250"),
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
    validators: [
      "15ANfaUMadXk65NtRqzCKuhAiVSA47Ks6fZs8rUcRQX11pzM",
      "13TrdLhMVLcwcEhMYLcqrkxAgq9M5gnK1LZKAF4VupVfQDUg",
      "19KaPfHSSjv4soqNW1tqPMwAnSGmG3pGydPzrPvaNLXLFDZ",
    ],
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("FEES");
      expect((latestOperation.extra as PolkadotOperationExtra).palletMethod).toBe(
        "staking.payoutStakers",
      );
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
  ];
};

const LOCAL_TESTNODE_WS_URL = "ws://127.0.0.1:8000";
const SIDECAR_BASE_URL = "http://127.0.0.1:8080";

const wsProvider = new WsProvider(LOCAL_TESTNODE_WS_URL, false);
let api: ApiPromise;
let unsubscribeNewBlockListener: () => void;

const coinConfig: PolkadotCoinConfig = {
  status: {
    type: "active",
  },
  node: {
    url: LOCAL_TESTNODE_WS_URL,
  },
  sidecar: {
    url: SIDECAR_BASE_URL,
  },
  metadataShortener: {
    url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
  },
  metadataHash: {
    url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
  },
};

const subscriptions: any[] = [];

export const PolkadotScenario: Scenario<PolkadotTransaction, PolkadotAccount> = {
  name: "Polkadot Ledger Live transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(
        `/${defaultNanoApp.firmware}/PolkadotMigration/app_${defaultNanoApp.version}.elf`,
      ),
      spawnChopsticksAndSidecar(),
    ]);

    const onSignerConfirmation = getOnSpeculosConfirmation("APPROVE");

    await cryptoWaitReady();
    await wsProvider.connect();
    api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

    const keyring = new Keyring({ type: "sr25519" });
    keyring.setSS58Format(0);

    const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(new Polkadot(transport));

    const { accountBridge, currencyBridge } = createBridges(signerContext, () => coinConfig);

    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/354'/0'/0'/0'",
      currency: polkadot,
      derivationMode: "polkadotbip44",
    });

    const polkadotScenarioAccountPair = keyring.addFromAddress(address, {
      name: "BASIC_SCENARIO_ACCOUNT",
    });

    // https://polkadot.js.org/docs/keyring/start/suri/#dev-accounts
    const alice = keyring.addFromUri("//Alice");

    const unsub = await api.tx.balances
      .transferAllowDeath(
        polkadotScenarioAccountPair.address,
        parseCurrencyUnit(polkadot.units[0], "500000").toNumber(),
      )
      .signAndSend(alice, result => {
        if (result.status.isFinalized) {
          unsub();
        }
      });

    const account = makeAccount(polkadotScenarioAccountPair.address, polkadot);

    return {
      accountBridge,
      currencyBridge,
      address: polkadotScenarioAccountPair.address,
      account,
      onSignerConfirmation,
    };
  },
  getTransactions,
  mockIndexer: async (account, optimistic) => {
    unsubscribeNewBlockListener = await api.rpc.chain.subscribeNewHeads(async header => {
      const blockHash = header.hash.toString();

      const res = await fetch(`${SIDECAR_BASE_URL}/blocks/${blockHash}`);
      const blockInfo = await res.json();

      const extrinsic = blockInfo.extrinsics.find((extrinsic: any) => {
        return extrinsic.hash === optimistic.hash;
      });

      // we only need the transactions made during the test
      if (!extrinsic) {
        return;
      }

      const { nonce } = (await api.query.system.account(account.freshAddress)) as any;

      const polkadotExtra = optimistic.extra as PolkadotOperationExtra;
      let amount = new BigNumber(0);
      let staking: ExplorerExtrinsic["staking"] = {} as ExplorerExtrinsic["staking"];
      let validatorStash = "";

      switch (polkadotExtra.palletMethod) {
        case "balances.transfer":
        case "balances.transferAllowDeath":
        case "balances.transferKeepAlive":
          amount = new BigNumber(polkadotExtra.transferAmount!);
          break;
        case "staking.bond":
        case "staking.rebond":
          amount = new BigNumber(polkadotExtra.bondedAmount!);
          break;
        case "staking.unbond":
          amount = new BigNumber(polkadotExtra.unbondedAmount!);
          break;
        case "staking.withdrawUnbonded":
          staking = {
            validators: polkadotExtra.validators?.map(address => ({ address })) ?? [],
            eventStaking: [
              {
                section: "staking",
                method: "Withdraw",
                value: polkadotExtra.withdrawUnbondedAmount!.toNumber(),
              },
            ],
          };
          break;
        case "staking.nominate":
          staking = {
            validators: polkadotExtra.validators?.map(address => ({ address })) ?? [],
            eventStaking: [
              {
                section: "staking",
                method: "Nominate",
                value: 0,
              },
            ],
          };
          break;
        case "staking.chill":
          break;
        case "staking.payoutStakers":
          validatorStash = extrinsic.args.validator_stash!;
          break;
        default:
          throw new Error(`Unsupported pallet method: ${polkadotExtra.palletMethod}`);
      }

      indexOperation(account.freshAddress, {
        blockNumber: blockInfo.number,
        timestamp: optimistic.date.getTime(),
        nonce,
        hash: optimistic.hash,
        signer: extrinsic.signature.signer.id,
        affectedAddress1: optimistic.recipients[0],
        method: extrinsic.method.method,
        section: extrinsic.method.pallet,
        isSuccess: extrinsic.success,
        amount: amount.toNumber(),
        partialFee: optimistic.fee.toNumber(),
        staking: staking!,
        validatorStash,
        index: 2, // not used by coin-module
        isBatch: false, // batch transactions are not supported in this coin module
      });
    });
  },
  beforeAll: async account => {
    expect(formatCurrencyUnit(polkadot.units[0], account.balance, { useGrouping: false })).toBe(
      "500000",
    );
  },
  beforeSync: async () => {
    await wsProvider.send("dev_newBlock", [{ count: 1 }]);
  },
  afterEach: async () => {
    unsubscribeNewBlockListener();
  },
  teardown: async () => {
    subscriptions.forEach(unsub => unsub());
    await wsProvider.disconnect();
    await Promise.all([killSpeculos(), killChopsticksAndSidecar()]);
  },
};
