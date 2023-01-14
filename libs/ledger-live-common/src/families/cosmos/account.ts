import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { getCurrentCosmosPreloadData } from "./preloadedData";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { CosmosOperation, CosmosExtraTxInfo, CosmosAccount } from "./types";
import { mapDelegations, mapUnbondings, mapRedelegations } from "./logic";
import type { Unit } from "@ledgerhq/types-cryptoassets";

function formatOperationSpecifics(
  op: CosmosOperation,
  unit: Unit | null | undefined
): string {
  const { validators } = op.extra;
  return (validators || [])
    .map(
      (v) =>
        `\n    to ${v.address} ${
          unit
            ? formatCurrencyUnit(unit, new BigNumber(v.amount), {
                showCode: true,
                disableRounding: true,
              }).padEnd(16)
            : v.amount
        }`
    )
    .join("");
}

export function formatAccountSpecifics(account: CosmosAccount): string {
  const { cosmosResources } = account;
  invariant(cosmosResources, "cosmos account expected");
  const { validators } = getCurrentCosmosPreloadData()[account.currency.id] ?? {
    validators: [],
  };
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";
  str +=
    formatCurrencyUnit(unit, account.spendableBalance, formatConfig) +
    " spendable. ";

  if (cosmosResources?.delegatedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cosmosResources.delegatedBalance, formatConfig) +
      " delegated. ";
  }

  if (cosmosResources?.unbondingBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cosmosResources.unbondingBalance, formatConfig) +
      " unbonding. ";
  }

  const mappedDelegations = mapDelegations(
    cosmosResources?.delegations ?? [],
    validators,
    unit
  );

  if (mappedDelegations.length) {
    str += "\nDELEGATIONS\n";
    str += mappedDelegations
      .map(
        (d) =>
          `  to ${d.validatorAddress} ${formatCurrencyUnit(unit, d.amount, {
            showCode: true,
            disableRounding: true,
          })} ${
            d.pendingRewards.gt(0)
              ? " (claimable " +
                formatCurrencyUnit(unit, d.amount, {
                  disableRounding: true,
                }) +
                ")"
              : ""
          }`
      )
      .join("\n");
  }

  const mappedUnbondings = mapUnbondings(
    cosmosResources?.unbondings ?? [],
    validators,
    unit
  );

  if (mappedUnbondings.length) {
    str += "\nUNDELEGATIONS\n";
    str += mappedUnbondings
      .map(
        (d) =>
          `  from ${d.validatorAddress} ${formatCurrencyUnit(unit, d.amount, {
            showCode: true,
            disableRounding: true,
          })}`
      )
      .join("\n");
  }

  const mappedRedelegations = mapRedelegations(
    cosmosResources?.redelegations ?? [],
    validators,
    unit
  );

  if (mappedRedelegations.length) {
    str += "\nREDELEGATIONS\n";
    str += mappedRedelegations
      .map(
        (d) =>
          `  from ${d.validatorSrcAddress} to ${
            d.validatorDstAddress
          } ${formatCurrencyUnit(unit, d.amount, {
            showCode: true,
            disableRounding: true,
          })}`
      )
      .join("\n");
  }

  return str;
}

export function fromOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): CosmosExtraTxInfo | Record<string, any> | null | undefined {
  let e = {};
  if (extra && extra.validators) {
    e = {
      ...extra,
      validators: extra.validators.map((o) => ({
        ...o,
        amount: new BigNumber(o.amount),
      })),
    };
  }
  return e;
}
export function toOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): CosmosExtraTxInfo | Record<string, any> | null | undefined {
  let e = {};

  if (extra && extra.validators) {
    e = {
      ...extra,
      validators: extra.validators.map((o) => ({
        ...o,
        amount: o.amount.toString(),
      })),
    };
  }
  return e;
}
export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
