// @flow
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "../../currencies";
import type {
  CosmosDelegation,
  CosmosDelegationInfo,
  CosmosValidatorItem,
  CosmosMappedDelegation,
  CosmosMappedDelegationInfo,
  CosmosSearchFilter,
  CosmosUnbonding,
  CosmosMappedUnbonding,
  CosmosRedelegation,
  CosmosMappedRedelegation,
} from "./types";
import type { CacheRes } from "../../cache";
import type { Unit, Account } from "../../types";
import type { Transaction } from "./types";
import { getFeesForTransaction } from "../../libcore/getFeesForTransaction";
import { makeLRUCache } from "../../cache";

export const COSMOS_MAX_REDELEGATIONS = 6;
export const COSMOS_MAX_UNBONDINGS = 6;
export const COSMOS_MAX_DELEGATIONS = 5;
export const COSMOS_MIN_SAFE = BigNumber(100000); // 100000 uAtom
export const COSMOS_MIN_FEES = BigNumber(6000); // 6000 uAtom

export function mapDelegations(
  delegations: CosmosDelegation[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedDelegation[] {
  return delegations.map((d) => {
    const rank = validators.findIndex(
      (v) => v.validatorAddress === d.validatorAddress
    );
    const validator = validators[rank];

    return {
      ...d,
      formattedAmount: formatCurrencyUnit(unit, d.amount, {
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
      formattedPendingRewards: formatCurrencyUnit(unit, d.pendingRewards, {
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
      rank,
      validator,
    };
  });
}

export function mapUnbondings(
  unbondings: CosmosUnbonding[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedUnbonding[] {
  return unbondings.map((u) => {
    const validator = validators.find(
      (v) => v.validatorAddress === u.validatorAddress
    );

    return {
      ...u,
      formattedAmount: formatCurrencyUnit(unit, u.amount, {
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
      validator,
    };
  });
}

export function mapRedelegations(
  redelegations: CosmosRedelegation[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedRedelegation[] {
  return redelegations.map((r) => {
    const validatorSrc = validators.find(
      (v) => v.validatorAddress === r.validatorSrcAddress
    );

    const validatorDst = validators.find(
      (v) => v.validatorAddress === r.validatorDstAddress
    );

    return {
      ...r,
      formattedAmount: formatCurrencyUnit(unit, r.amount, {
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
      validatorSrc,
      validatorDst,
    };
  });
}

export const mapDelegationInfo = (
  delegations: CosmosDelegationInfo[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedDelegationInfo[] => {
  return delegations.map((d) => ({
    ...d,
    validator: validators.find((v) => v.validatorAddress === d.address),
    formattedAmount: formatCurrencyUnit(unit, d.amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    }),
  }));
};

export const formatValue = (value: BigNumber, unit: Unit): number =>
  value
    .dividedBy(10 ** unit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();

export const searchFilter: CosmosSearchFilter = (query) => ({ validator }) => {
  const terms = `${validator?.name ?? ""} ${validator?.validatorAddress ?? ""}`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};

export const getMaxEstimatedBalance = (
  a: Account,
  estimatedFees: BigNumber
): BigNumber => {
  const { cosmosResources } = a;
  let blockBalance = BigNumber(0);
  if (cosmosResources) {
    blockBalance = cosmosResources.unbondingBalance.plus(
      cosmosResources.delegatedBalance
    );
  }

  return a.balance.minus(estimatedFees).minus(blockBalance);
};

export const calculateFees: CacheRes<
  Array<{ a: Account, t: Transaction }>,
  { estimatedFees: BigNumber }
> = makeLRUCache(
  async ({ a, t }): Promise<{ estimatedFees: BigNumber }> => {
    return getFeesForTransaction({
      account: a,
      transaction: t,
    });
  },
  ({ a, t }) =>
    `${a.id}_${t.amount.toString()}_${t.recipient}_${
      t.gasLimit ? t.gasLimit.toString() : ""
    }_${t.fees ? t.fees.toString() : ""}
    _${String(t.useAllAmount)}_${t.mode}_${
      t.validators ? t.validators.map((v) => v.address).join("-") : ""
    }_${t.memo ? t.memo.toString() : ""}_${
      t.cosmosSourceValidator ? t.cosmosSourceValidator : ""
    }`
);
