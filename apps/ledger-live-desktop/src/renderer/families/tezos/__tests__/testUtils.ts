import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type {
  Delegation,
  StakingPosition,
  TezosAccount,
} from "@ledgerhq/live-common/families/tezos/types";
import type { TezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";

export const tezosCurrency = getCryptoCurrencyById("tezos");

export const createMockAccount = (
  seed = "tezos-test",
  overrides: Partial<TezosAccount> = {},
): TezosAccount =>
  ({
    ...genAccount(seed, { currency: tezosCurrency }),
    operations: [],
    ...overrides,
  }) as unknown as TezosAccount;

export const defaultStakingInfo: TezosStakingInfo = {
  isDelegated: false,
  isStaked: false,
  hasUnstaking: false,
  delegation: null,
  stakedBalance: new BigNumber(0),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(0),
  delegateAddress: undefined,
  unstakingPositions: [],
};

export const createMockDelegation = (overrides: { operationDate?: Date } = {}): Delegation =>
  ({
    address: "tz1baker",
    baker: {
      address: "tz1baker",
      name: "Acme Baker",
      logoURL: "https://example.test/baker.png",
      capacityStatus: "normal",
    },
    operation: { hash: "op_hash_xyz", date: overrides.operationDate ?? new Date() },
    isPending: false,
    receiveShouldWarnDelegation: false,
    sendShouldWarnDelegation: false,
  }) as never;

export const createMockUnstakingPosition = (
  uid: string,
  amount: number,
  hoursAgo: number,
  delegate = "tz1baker",
): StakingPosition =>
  ({
    uid: `unstake-${uid}`,
    address: "tz1self",
    delegate,
    state: "deactivating",
    asset: { type: "native" },
    amount: new BigNumber(amount),
    createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  }) as never;

export const createMockOperation = (accountId: string | undefined = "") => ({
  id: "op-1",
  hash: "h",
  accountId,
  type: "OUT" as const,
  value: new BigNumber(0),
  fee: new BigNumber(0),
  senders: [],
  recipients: [],
  blockHeight: null,
  blockHash: null,
  transactionSequenceNumber: 0,
  date: new Date(),
  extra: {},
});
