import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { makeAccount, TEZOS } from "../fixtures";
import { buildTz1Signer, buildTz2Signer } from "../signer";
import { getBridges } from "../helpers";
import {
  BAKERS_URL,
  bakerAddresses,
  endpointOf,
  startTezosSandbox,
  waitForIndexedOperation,
} from "../sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Account, OperationType } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { TezosTestSigner } from "../signer";

type TezosScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const AIRDROP_XTZ = 20;

function makeScenarioTransactions(
  addressType: "tz1" | "tz2",
  { baker, recipient }: { baker: string; recipient: string },
): TezosScenarioTransaction[] {
  const sendOneTez: TezosScenarioTransaction = {
    name: `Send 1 XTZ from unrevealed account (${addressType})`,
    amount: new BigNumber(1e6),
    recipient,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThanOrEqual(2);
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation, revealOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(revealOperation.type).toBe("REVEAL");
      expect(latestOperation.recipients).toContain(recipient);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value.plus(revealOperation.fee)),
      );
    },
  };

  const sendFiveTez: TezosScenarioTransaction = {
    name: `Send 5 XTZ from revealed account (${addressType})`,
    amount: new BigNumber(5e6),
    recipient,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.recipients).toContain(recipient);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const delegate: TezosScenarioTransaction = {
    name: "Delegate to a sandbox baker",
    mode: "delegate",
    recipient: baker,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("DELEGATE");
      expect(latestOperation.recipients).toContain(baker);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const undelegate: TezosScenarioTransaction = {
    name: "Undelegate",
    mode: "undelegate",
    recipient: "",
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("UNDELEGATE");
      expect(latestOperation.recipients).toContain(baker);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const sendMax: TezosScenarioTransaction = {
    name: "Send max XTZ",
    useAllAmount: true,
    recipient,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");
      expect(latestOperation.recipients).toContain(recipient);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  return [sendOneTez, sendFiveTez, delegate, undelegate, sendMax];
}

type AddressKind = {
  addressType: "tz1" | "tz2";
  curve: "ed25519" | "secp256k1";
  path: string;
  derivationMode: "" | "tezosSecp256k1";
  buildSigner: () => Promise<TezosTestSigner>;
};

function makeTezosScenario({
  addressType,
  curve,
  path,
  derivationMode,
  buildSigner,
}: AddressKind): Scenario<GenericTransaction, Account> {
  let sandbox: Sandbox | undefined;
  let closeGuard: (() => void) | null = null;
  let indexer = "";
  let baker = "";
  let recipient = "";

  return {
    name: `Ledger Live Tezos — Full scenario (${addressType} / ${curve})`,

    setup: async () => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      sandbox = await startTezosSandbox();
      const node = endpointOf(sandbox, "node");
      indexer = endpointOf(sandbox, "indexer");
      const bakers = await bakerAddresses();
      if (bakers.length < 2) {
        throw new Error(`the scenario needs 2 sandbox bakers, got ${bakers.length}`);
      }
      const [firstBaker, existingAccount] = bakers;
      baker = firstBaker;
      recipient = existingAccount;

      const signer = await buildSigner();
      const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);
      const { address } = await getAddress("", { path, currency: TEZOS, derivationMode });

      const airdropHash = await sandbox.airdrop(address, AIRDROP_XTZ);
      await waitForIndexedOperation(indexer, airdropHash);

      LiveConfig.setConfig({
        config_currency_tezos: {
          type: "object",
          default: {
            status: { type: "active" as const },
            name: "Tezos",
            unit: { name: "XTZ", code: "XTZ", magnitude: 6 },
            baker: { url: BAKERS_URL },
            explorer: { url: indexer, maxTxQuery: 100 },
            node: { url: node },
            fees: {
              minGasLimit: 600,
              minRevealGasLimit: 300,
              minStorageLimit: 0,
              minFees: 300,
              minEstimatedFees: 300,
            },
          },
        },
      });

      closeGuard = forbidRemoteRequests();

      return { currencyBridge, accountBridge, account: makeAccount(address, derivationMode) };
    },

    getTransactions: () => makeScenarioTransactions(addressType, { baker, recipient }),
    mockIndexer: async (_, optimisticOperation) => {
      await waitForIndexedOperation(indexer, optimisticOperation.hash);
    },
    beforeAll: account => {
      expect(account.balance).toStrictEqual(new BigNumber(AIRDROP_XTZ * 1e6));
      expect(account.operations.map(op => op.type)).toStrictEqual(["IN"]);
    },
    afterAll: account => {
      const count = (type: OperationType) =>
        account.operations.filter(op => op.type === type).length;
      expect(count("IN")).toBe(1);
      expect(count("OUT")).toBe(3);
      expect(count("REVEAL")).toBe(1);
      expect(count("DELEGATE")).toBe(1);
      expect(count("UNDELEGATE")).toBe(1);

      // Send-max leaves the dust margin behind (DUST_MARGIN_MUTEZ, less the fee-per-gas/op-size
      // increment), independently of how the `minFees` floor compares to the suggested fee.
      expect(account.balance.toNumber()).toBeLessThanOrEqual(500);
    },

    teardown: async () => {
      closeGuard?.();
      closeGuard = null;
      const running = sandbox;
      sandbox = undefined;
      await running?.down();
    },
  };
}

export const scenarioTezosTz1 = makeTezosScenario({
  addressType: "tz1",
  curve: "ed25519",
  path: "44'/1729'/0'/0'",
  derivationMode: "",
  buildSigner: buildTz1Signer,
});

export const scenarioTezosTz2 = makeTezosScenario({
  addressType: "tz2",
  curve: "secp256k1",
  path: "44'/1729'/0'",
  derivationMode: "tezosSecp256k1",
  buildSigner: buildTz2Signer,
});
