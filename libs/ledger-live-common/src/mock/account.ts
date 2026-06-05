import Prando from "prando";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { GenAccountOptions } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  genAccount as genAccountCommon,
  genOperation,
  ensureNoNegative,
} from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "../bridge";
import { getLoadedMockAccountForFamily, loadMockAccountForFamily } from "../coin-modules/registry";
import { CosmosAccount } from "../families/cosmos/types";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import { PolkadotAccount } from "@ledgerhq/coin-polkadot/types/index";
import { TezosAccount } from "@ledgerhq/coin-tezos/types/index";
import { TronAccount } from "@ledgerhq/coin-tron/types/index";
import { CardanoAccount, PaymentChain } from "@ledgerhq/coin-cardano/types";
import { types } from "@stricahq/typhonjs";
import { SolanaAccount } from "@ledgerhq/coin-solana/types";

/**
 * @memberof mock/account
 */
export async function genAddingOperationsInAccount(
  account: Account,
  count: number,
  seed: number | string,
): Promise<Account> {
  const rng = new Prando(seed);
  const perFamilyOperation = await loadMockAccountForFamily(account.currency.family);
  const copy: Account = { ...account };
  copy.operations = Array(count)
    .fill(null)
    .reduce(ops => {
      const op = genOperation(copy, copy, ops, rng);
      return ops.concat(op);
    }, copy.operations);
  copy.spendableBalance = copy.balance = ensureNoNegative(copy.operations);
  perFamilyOperation?.postSyncAccount?.(copy);
  return copy;
}

/**
 * Sync mock account generator. Silently skips `genAccountEnhanceOperations`
 * (e.g. cosmos delegations, algorand opt-ins) unless the caller has already
 * awaited `loadMockAccountForFamily` for the currency's family. Prefer
 * `genMockAccount` (async), which guarantees the module is loaded.
 */
export function genAccountLegacy(id: number | string, opts: GenAccountOptions = {}): Account {
  return genAccountCommon(
    id,
    opts,
    (account: Account, currency: CryptoCurrency, address: string) => {
      switch (currency.family) {
        case "solana":
          (account as SolanaAccount).solanaResources = {
            stakes: [],
            unstakeReserve: new BigNumber(0),
          };
          break;
        case "cosmos":
          (account as CosmosAccount).cosmosResources = {
            // TODO variation in these
            delegations: [],
            redelegations: [],
            unbondings: [],
            delegatedBalance: new BigNumber(0),
            pendingRewardsBalance: new BigNumber(0),
            unbondingBalance: new BigNumber(0),
            withdrawAddress: address,
            sequence: 0,
          };
          break;
        case "bitcoin":
          (account as BitcoinAccount).bitcoinResources = {
            utxos: [],
            walletAccount: undefined,
          };
          break;
        case "polkadot":
          (account as PolkadotAccount).polkadotResources = {
            stash: null,
            controller: null,
            nonce: 0,
            lockedBalance: new BigNumber(0),
            unlockingBalance: new BigNumber(0),
            unlockedBalance: new BigNumber(0),
            unlockings: [],
            nominations: [],
            numSlashingSpans: 0,
          };
          break;
        case "tezos":
          (account as TezosAccount).tezosResources = {
            revealed: true,
            counter: 0,
          };
          break;
        case "tron":
          // TODO variation in these. you could use the account.name as a way to split cases
          (account as TronAccount).tronResources = {
            frozen: {
              bandwidth: null,
              energy: null,
            },
            unFrozen: {
              bandwidth: null,
              energy: null,
            },
            delegatedFrozen: {
              bandwidth: null,
              energy: null,
            },
            legacyFrozen: {
              bandwidth: null,
              energy: null,
            },
            votes: [],
            tronPower: 0,
            energy: BigNumber(0),
            bandwidth: {
              freeUsed: BigNumber(0),
              freeLimit: BigNumber(opts.bandwidth ? 1 : 0),
              gainedUsed: BigNumber(0),
              gainedLimit: BigNumber(0),
            },
            unwithdrawnReward: BigNumber(0),
            lastWithdrawnRewardDate: null,
            lastVotedDate: null,
          };
          break;
        case "cardano":
          (account as CardanoAccount).cardanoResources = {
            delegation: {
              status: true,
              deposit: "2000000",
              poolId: "45",
              ticker: "ADA",
              name: "Cardano",
              dRepHex: undefined,
              rewards: new BigNumber(42),
            },
            externalCredentials: [
              {
                isUsed: false,
                key: "test",
                path: {
                  purpose: 1852,
                  coin: 1815,
                  account: 4,
                  chain: PaymentChain.external,
                  index: 0,
                },
              },
            ],
            internalCredentials: [
              {
                isUsed: false,
                key: "test",
                path: {
                  purpose: 1852,
                  coin: 1815,
                  account: 4,
                  chain: PaymentChain.internal,
                  index: 0,
                },
              },
            ],
            utxos: [
              {
                hash: "",
                index: 0,
                address: "",
                amount: new BigNumber(10),
                tokens: [],
                paymentCredential: {
                  key: "",
                  path: { purpose: 0, coin: 0, account: 0, chain: PaymentChain.internal, index: 0 },
                },
              },
            ],
            protocolParams: {
              minFeeA: "",
              minFeeB: "",
              stakeKeyDeposit: "",
              lovelacePerUtxoWord: "",
              collateralPercent: "",
              priceMem: "",
              priceSteps: "",
              maxTxSize: "",
              maxValueSize: "",
              utxoCostPerByte: "",
              minFeeRefScriptCostPerByte: "",
              languageView: {} as types.LanguageView,
            },
          };
          break;
        default: {
          getAccountBridge(account)
            .then(bridge => {
              bridge.initAccount?.(account);
            })
            .catch(() => {
              // to fix /src/__tests__/cross.ts, skip bridge error if there is no bridge in such currency
            });
        }
      }
    },
    (account: Account, currency: CryptoCurrency, rng: Prando) => {
      // Sync path: only finds the module if a caller has already awaited
      // loadMockAccountForFamily for this family. Prefer genMockAccount
      // which guarantees the module is loaded.
      getLoadedMockAccountForFamily(currency.family)?.genAccountEnhanceOperations?.(account, rng);
    },
  );
}

/**
 * Async mock account generator. Pre-loads the family's mock account module
 * so `genAccountEnhanceOperations` is applied at creation (e.g. cosmos
 * delegations, algorand asset opt-ins). Prefer this over `genAccountLegacy`
 * in any async-capable call site.
 *
 * `opts.currency` is required (unlike `genAccountLegacy`) to guarantee the
 * preload targets the right family — letting the framework pick a random
 * currency would re-introduce the silent-skip bug this function is meant
 * to fix.
 */
export async function genMockAccount(
  id: number | string,
  opts: GenAccountOptions & { currency: CryptoCurrency },
): Promise<Account> {
  await loadMockAccountForFamily(opts.currency.family);
  return genAccountLegacy(id, opts);
}

/**
 * @deprecated Alias of `genAccountLegacy`. Prefer `genMockAccount` (async).
 */
export const genAccount = genAccountLegacy;
