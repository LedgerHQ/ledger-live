import invariant from "invariant";
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
  CosmosAccount,
} from "./types";
import type { Transaction } from "../../generated/types";
import { calculateFees } from "./js-prepareTransaction";
import type { Unit } from "@ledgerhq/types-cryptoassets";

export const COSMOS_MAX_REDELEGATIONS = 7;
export const COSMOS_MAX_UNBONDINGS = 7;
export const COSMOS_MAX_DELEGATIONS = 5;
export const COSMOS_MIN_SAFE = new BigNumber(100000); // 100000 uAtom

export const COSMOS_MIN_FEES = new BigNumber(6000); // 6000 uAtom

export function mapDelegations(
  delegations: CosmosDelegation[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedDelegation[] {
  return delegations.map((d) => {
    const rank = validators.findIndex(
      (v) => v.validatorAddress === d.validatorAddress
    );
    const validator = validators[rank] ?? d;
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
  return unbondings
    .sort((a, b) => a.completionDate.valueOf() - b.completionDate.valueOf())
    .map((u) => {
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
  unit: Unit,
  transaction?: Transaction
): CosmosMappedDelegationInfo[] => {
  return delegations.map((d) => ({
    ...d,
    validator: validators.find((v) => v.validatorAddress === d.address),
    formattedAmount: formatCurrencyUnit(
      unit,
      transaction ? transaction.amount : d.amount,
      {
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }
    ),
  }));
};
export const formatValue = (value: BigNumber, unit: Unit): number =>
  value
    .dividedBy(10 ** unit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();
export const searchFilter: CosmosSearchFilter =
  (query) =>
  ({ validator }) => {
    const terms = `${validator?.name ?? ""} ${
      validator?.validatorAddress ?? ""
    }`;
    return terms.toLowerCase().includes(query.toLowerCase().trim());
  };
export function getMaxDelegationAvailable(
  account: CosmosAccount,
  validatorsLength: number
): BigNumber {
  const numberOfDelegations = Math.min(
    COSMOS_MAX_DELEGATIONS,
    validatorsLength || 1
  );
  const { spendableBalance } = account;
  return spendableBalance
    .minus(COSMOS_MIN_FEES.multipliedBy(numberOfDelegations))
    .minus(COSMOS_MIN_SAFE);
}
export const getMaxEstimatedBalance = (
  a: CosmosAccount,
  estimatedFees: BigNumber
): BigNumber => {
  const { cosmosResources } = a;
  let blockBalance = new BigNumber(0);

  if (cosmosResources) {
    blockBalance = cosmosResources.unbondingBalance.plus(
      cosmosResources.delegatedBalance
    );
  }

  const amount = a.balance.minus(estimatedFees).minus(blockBalance);

  // If the fees are greater than the balance we will have a negative amount
  // so we round it to 0
  if (amount.lt(0)) {
    return new BigNumber(0);
  }

  return amount;
};

export function canUndelegate(account: CosmosAccount): boolean {
  const { cosmosResources } = account;
  invariant(cosmosResources, "cosmosResources should exist");
  return (
    !!cosmosResources?.unbondings &&
    cosmosResources.unbondings.length < COSMOS_MAX_UNBONDINGS
  );
}

export function canDelegate(account: CosmosAccount): boolean {
  const maxSpendableBalance = getMaxDelegationAvailable(account, 1);
  return maxSpendableBalance.gt(0);
}

export function canRedelegate(
  account: CosmosAccount,
  delegation: CosmosDelegation | CosmosValidatorItem
): boolean {
  const { cosmosResources } = account;
  invariant(cosmosResources, "cosmosResources should exist");
  return (
    !!cosmosResources?.redelegations &&
    cosmosResources.redelegations.length < COSMOS_MAX_REDELEGATIONS &&
    !cosmosResources.redelegations.some(
      (rd) => rd.validatorDstAddress === delegation.validatorAddress
    )
  );
}

export async function canClaimRewards(
  account: CosmosAccount,
  delegation: CosmosDelegation
): Promise<boolean> {
  const { cosmosResources } = account;
  invariant(cosmosResources, "cosmosResources should exist");
  const res = await calculateFees({
    account,
    transaction: {
      family: "cosmos",
      mode: "claimReward",
      amount: new BigNumber(0),
      fees: null,
      gas: null,
      recipient: "",
      useAllAmount: false,
      networkInfo: null,
      memo: null,
      sourceValidator: null,
      validators: [
        {
          address: delegation.validatorAddress,
          amount: new BigNumber(0),
        },
      ],
    },
  });
  return (
    res.estimatedFees.lt(account.spendableBalance) &&
    res.estimatedFees.lt(delegation.pendingRewards)
  );
}

export function getRedelegation(
  account: CosmosAccount,
  delegation: CosmosMappedDelegation
): CosmosRedelegation | null | undefined {
  const { cosmosResources } = account;
  const redelegations = cosmosResources?.redelegations ?? [];
  const currentRedelegation = redelegations.find(
    (r) => r.validatorDstAddress === delegation.validatorAddress
  );
  return currentRedelegation;
}

export function getRedelegationCompletionDate(
  account: CosmosAccount,
  delegation: CosmosMappedDelegation
): Date | null | undefined {
  const currentRedelegation = getRedelegation(account, delegation);
  return currentRedelegation ? currentRedelegation.completionDate : null;
}
