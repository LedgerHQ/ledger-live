import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { Transaction as PolkadotTransaction } from "../../../types/bridge";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import resolver from "../../../signer";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { createBridges } from "../../../bridge";
import { makeAccount } from "../../fixtures";
import { defaultNanoApp } from "../scenarios.test";
import BigNumber from "bignumber.js";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { PolkadotCoinConfig } from "../../../config";
import { killChopsticksAndSidecar, spawnChopsticksAndSidecar } from "../chopsticks-sidecar";
import { polkadot } from "./utils";
import { indexOperation } from "../indexer";

function getTransactions() {
  const send1DotTransaction: ScenarioTransaction<PolkadotTransaction> = {
    name: "send 1 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: new BigNumber(1),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      console.log({
        latestOperationValue: latestOperation?.value.toFixed(),
        operations: currentAccount.operations,
        previousAccountOperations: previousAccount.operations,
        diffLength: currentAccount.operations.length - previousAccount.operations.length,
      });
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(1).toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  const send100DotTransaction: ScenarioTransaction<PolkadotTransaction> = {
    name: "send 100 DOT",
    recipient: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
    amount: new BigNumber(100),
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      console.log({ latestOperation });
      expect(currentAccount.operations.length - previousAccount.operations.length).toBe(2);
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.plus(100).toFixed());
      expect(currentAccount.balance.toFixed()).toBe(
        previousAccount.balance.minus(latestOperation.value).toFixed(),
      );
    },
  };

  return [send1DotTransaction, send100DotTransaction];
}

const wsProvider = new WsProvider("ws://127.0.0.1:8000", false);
let api: ApiPromise;
let unsubscribeNewBlockListener: () => void;

const SIDECAR_BASE_URL = "http://127.0.0.1:8080";

const coinConfig: PolkadotCoinConfig = {
  status: {
    type: "active",
  },
  sidecar: {
    url: SIDECAR_BASE_URL,
  },
};

export const basicScenario: Scenario<PolkadotTransaction> = {
  name: "Polkadot Basic transactions",
  setup: async () => {
    const [{ transport, getOnSpeculosConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Polkadot/app_${defaultNanoApp.version}.elf`),
      spawnChopsticksAndSidecar(),
    ]);

    const onSignerConfirmation = getOnSpeculosConfirmation("APPROVE");
    await cryptoWaitReady();
    await wsProvider.connect();
    api = await ApiPromise.create({ provider: wsProvider });

    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]);
    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

    const keyring = new Keyring({ type: "sr25519" });
    keyring.setSS58Format(0);

    const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(new Polkadot(transport));

    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/354'/0'/0'/0'",
      currency: polkadot,
      derivationMode: "polkadotbip44",
    });

    const basicScenarioAccountPair = keyring.addFromAddress(address, {
      name: "BASIC_SCENARIO_ACCOUNT",
    });

    // https://polkadot.js.org/docs/keyring/start/suri/#dev-accounts
    const alice = keyring.addFromUri("//Alice");

    await api.query.system.account(
      basicScenarioAccountPair.address,
      ({ nonce, data: balance }: any) => {
        console.log(
          `free balance for ${basicScenarioAccountPair.meta.name} account is ${balance.free} with ${balance.reserved} reserved and a nonce of ${nonce}`,
        );
      },
    );

    const unsub = await api.tx.balances
      .transferAllowDeath(basicScenarioAccountPair.address, 90_000_000_000)
      .signAndSend(alice, async (result: any) => {
        console.log(`Current status is ${result.status}`);

        if (result.status.isInBlock) {
          console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
        } else if (result.status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
          unsub();
        }
      });

    const { accountBridge, currencyBridge } = createBridges(signerContext, () => coinConfig);

    const account = makeAccount(basicScenarioAccountPair.address, polkadot);

    return {
      accountBridge,
      currencyBridge,
      address: basicScenarioAccountPair.address,
      account,
      onSignerConfirmation,
    };
  },
  getTransactions,
  mockIndexer: async (account, optimistic) => {
    unsubscribeNewBlockListener = await api.rpc.chain.subscribeNewHeads(async (header: any) => {
      console.log(`Chain is at block: #${header.number}`);

      const blockHash = header.hash.toString("hex");

      const res = await fetch(`${SIDECAR_BASE_URL}/blocks/${blockHash}`);
      const blockInfo = await res.json();

      const extrinsic = blockInfo.extrinsics.find((extrinsic: any) => {
        return extrinsic.hash === optimistic.hash;
      });

      // we only need to index the transactions made by the account
      if (!extrinsic) {
        return;
      }

      const { nonce } = (await api.query.system.account(account.freshAddress)) as any;

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
        amount: optimistic.value.minus(optimistic.fee).toNumber(),
        partialFee: optimistic.fee.toNumber(),
        index: 2, // Not used by coin-module
        isBatch: false, // batch transactions are not supported yet
      });
    });
  },
  beforeAll: async account => {
    expect(account.balance.toFixed()).toBe("90000000000");
  },
  afterEach: async () => {
    unsubscribeNewBlockListener();
    // delay needed between transactions to avoid nonce collision
    await new Promise(resolve => setTimeout(resolve, 3000));
  },
  teardown: async () => {
    await wsProvider.disconnect();
    await Promise.all([killSpeculos(), killChopsticksAndSidecar()]);
  },
};
