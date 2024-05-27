import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { Transaction as PolkadotTransaction } from "../../../types/bridge";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/lib/signers/speculos";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import resolver from "../../../signer";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { createBridges } from "../../../bridge";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeAccount } from "../../fixtures";
import { killChopsticks, spawnChopsticks } from "../chopsticks";
import { defaultNanoApp } from "../scenarios.test";
import BigNumber from "bignumber.js";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { PolkadotCoinConfig } from "../../../config";

const polkadot = getCryptoCurrencyById("polkadot");

function getTransactions() {
  const send1DotTransaction: ScenarioTransaction<PolkadotTransaction> = {
    name: "send 1 DOT",
    recipient: "14Gjs1TD93gnwEBfDMHoCgsuf1s2TVKUP6Z1qKmAZnZ8cW5q",
    amount: new BigNumber(1),
  };

  const send100DotTransaction: ScenarioTransaction<PolkadotTransaction> = {
    name: "send 100 DOT",
    recipient: "14Gjs1TD93gnwEBfDMHoCgsuf1s2TVKUP6Z1qKmAZnZ8cW5q",
    amount: new BigNumber(100),
  };

  return [send1DotTransaction, send100DotTransaction];
}

const wsProvider = new WsProvider("ws://127.0.0.1:8000", false);

const coinConfig: PolkadotCoinConfig = {
  status: {
    type: "active",
  },
  sidecar: {
    url: "https://polkadot-sidecar.coin.ledger.com",
  },
};

export const basicScenario: Scenario<PolkadotTransaction> = {
  name: "Polkadot Basic transactions",
  setup: async () => {
    const [{ transport, onSignerConfirmation }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Polkadot/app_${defaultNanoApp.version}.elf`),
      spawnChopsticks(),
    ]);

    await cryptoWaitReady();
    await wsProvider.connect();
    const api = await ApiPromise.create({ provider: wsProvider });

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

    await api.query.system.account(basicScenarioAccountPair.address),
      ({ nonce, data: balance }: any) => {
        console.log(
          `free balance is ${balance.free} with ${balance.reserved} reserved and a nonce of ${nonce}`,
        );
      };

    const unsub = await api.tx.balances
      .transferKeepAlive(basicScenarioAccountPair.address, 500)
      .signAndSend(alice, async result => {
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
  teardown: async () => {
    await wsProvider.disconnect();
    await Promise.all([killSpeculos(), killChopsticks()]);
  },
};
