import Prando from "prando";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { GenAccountOptions } from "@ledgerhq/coin-framework/mocks/account";
import {
  genAccount as genAccountCommon,
  genOperation,
  ensureNoNegative,
} from "@ledgerhq/coin-framework/mocks/account";
import { getAccountBridge } from "../bridge";
import perFamilyMock from "../generated/mock";
import { CosmosAccount } from "../families/cosmos/types";
import { BitcoinAccount } from "../families/bitcoin/types";
import { PolkadotAccount } from "@ledgerhq/coin-polkadot/types";
import { TezosAccount } from "../families/tezos/types";
import { TronAccount } from "../families/tron/types";
import { CardanoAccount, PaymentChain } from "../families/cardano/types";
import { types } from "@stricahq/typhonjs";

/**
 * @memberof mock/account
 */
export function genAddingOperationsInAccount(
  account: Account,
  count: number,
  seed: number | string,
): Account {
  const rng = new Prando(seed);
  const copy: Account = { ...account };
  copy.operations = Array(count)
    .fill(null)
    .reduce(ops => {
      const op = genOperation(copy, copy, ops, rng);
      return ops.concat(op);
    }, copy.operations);
  copy.spendableBalance = copy.balance = ensureNoNegative(copy.operations);
  const perFamilyOperation = perFamilyMock[account.currency.id];
  const postSyncAccount = perFamilyOperation && perFamilyOperation.postSyncAccount;
  if (postSyncAccount) postSyncAccount(copy);
  return copy;
}

export function genAccount(id: number | string, opts: GenAccountOptions = {}): Account {
  return genAccountCommon(
    id,
    opts,
    (account: Account, currency: CryptoCurrency, address: string) => {
      switch (currency.family) {
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
              freeLimit: BigNumber(1),
              gainedUsed: BigNumber(0),
              gainedLimit: BigNumber(0),
            },
            unwithdrawnReward: BigNumber(0),
            lastWithdrawnRewardDate: null,
            lastVotedDate: null,
            cacheTransactionInfoById: {},
          };
          break;
        case "cardano":
          (account as CardanoAccount).cardanoResources = {
            delegation: {
              status: true,
              poolId: "45",
              ticker: "ADA",
              name: "Cardano",
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
              languageView: {} as types.LanguageView,
            },
          };
          break;
        default: {
          try {
            const bridge = getAccountBridge(account);
            const initAccount = bridge.initAccount;
            if (initAccount) {
              initAccount(account);
            }
          } catch (e: any) {
            // to fix /src/__tests__/cross.ts, skip bridge error if there is no bridge in such currency
          }
        }
      }
    },
    (account: Account, currency: CryptoCurrency, rng: Prando) => {
      const perFamilyOperation = perFamilyMock[currency.id];
      const genAccountEnhanceOperations =
        perFamilyOperation && perFamilyOperation.genAccountEnhanceOperations;
      if (genAccountEnhanceOperations) {
        genAccountEnhanceOperations(account, rng);
      }
    },
  );
}
