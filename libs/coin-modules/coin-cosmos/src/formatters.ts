import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { mapDelegations, mapRedelegations, mapUnbondings } from "./logic";
import { getCurrentCosmosPreloadData } from "./preloadedData";
import { CosmosAccount, CosmosOperation } from "./types";

function formatOperationSpecifics(op: CosmosOperation, unit: Unit | null | undefined): string {
  const { validators } = op.extra;
  return (validators || [])
    .map(
      v =>
        `\n    to ${v.address} ${
          unit
            ? formatCurrencyUnit(unit, new BigNumber(v.amount), {
                showCode: true,
                disableRounding: true,
              }).padEnd(16)
            : v.amount
        }`,
    )
    .join("");
}

export function formatAccountSpecifics(account: CosmosAccount): string {
  const { cosmosResources } = account;
  invariant(cosmosResources, "cosmos account expected");
  const { validators } = getCurrentCosmosPreloadData()[account.currency.id] ?? {
    validators: [],
  };
  const unit = getAccountCurrency(account).units[0];
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";
  str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";

  if (cosmosResources?.delegatedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cosmosResources.delegatedBalance, formatConfig) + " delegated. ";
  }

  if (cosmosResources?.unbondingBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cosmosResources.unbondingBalance, formatConfig) + " unbonding. ";
  }

  const mappedDelegations = mapDelegations(cosmosResources?.delegations ?? [], validators, unit);

  if (mappedDelegations.length) {
    str += "\nDELEGATIONS\n";
    str += mappedDelegations
      .map(
        d =>
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
          }`,
      )
      .join("\n");
  }

  const mappedUnbondings = mapUnbondings(cosmosResources?.unbondings ?? [], validators, unit);

  if (mappedUnbondings.length) {
    str += "\nUNDELEGATIONS\n";
    str += mappedUnbondings
      .map(
        d =>
          `  from ${d.validatorAddress} ${formatCurrencyUnit(unit, d.amount, {
            showCode: true,
            disableRounding: true,
          })}`,
      )
      .join("\n");
  }

  const mappedRedelegations = mapRedelegations(
    cosmosResources?.redelegations ?? [],
    validators,
    unit,
  );

  if (mappedRedelegations.length) {
    str += "\nREDELEGATIONS\n";
    str += mappedRedelegations
      .map(
        d =>
          `  from ${d.validatorSrcAddress} to ${d.validatorDstAddress} ${formatCurrencyUnit(
            unit,
            d.amount,
            {
              showCode: true,
              disableRounding: true,
            },
          )}`,
      )
      .join("\n");
  }

  return str;
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
