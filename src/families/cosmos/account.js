// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Account, Operation, Unit } from "../../types";
import { getCurrentCosmosPreloadData } from "./preloadedData";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { mapDelegations, mapUnbondings, mapRedelegations } from "./logic";

function formatOperationSpecifics(op: Operation, unit: ?Unit): string {
  const { validators } = op.extra;
  return (validators || []).map(
    (v) =>
      `\n    to ${v.address} ${
        unit
          ? formatCurrencyUnit(unit, BigNumber(v.amount), {
              showCode: true,
              disableRounding: true,
            }).padEnd(16)
          : v.amount
      }`
  );
}

function formatAccountSpecifics(account: Account): string {
  const { cosmosResources } = account;
  invariant(cosmosResources, "cosmos account expected");
  const { validators } = getCurrentCosmosPreloadData();
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  let str = "";

  str +=
    formatCurrencyUnit(unit, account.spendableBalance, formatConfig) +
    " spendable. ";
  if (cosmosResources.delegatedBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cosmosResources.delegatedBalance, formatConfig) +
      " delegated. ";
  }
  if (cosmosResources.unbondingBalance.gt(0)) {
    str +=
      formatCurrencyUnit(unit, cosmosResources.unbondingBalance, formatConfig) +
      " unbonding. ";
  }

  const mappedDelegations = mapDelegations(
    cosmosResources.delegations,
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
    cosmosResources.unbondings,
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
    cosmosResources.redelegations,
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

export default { formatAccountSpecifics, formatOperationSpecifics };
