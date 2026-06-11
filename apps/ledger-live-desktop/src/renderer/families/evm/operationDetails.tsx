import React, { useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import {
  getValidatorExplorerUrl,
  resolveRedelegationValidators,
  resolveStakingValidator,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import { Divider } from "@ledgerhq/react-ui/index";
import { openURL } from "~/renderer/linking";
import {
  Address,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import type { AmountCellExtraProps, OperationDetailsExtraProps } from "../types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { Account, Operation } from "@ledgerhq/types-live";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";

const formatConfig = {
  disableRounding: true,
  alwaysShowSign: false,
  showCode: true,
};

function useValidatorLink(account: Account) {
  const explorerView = useMemo(() => getDefaultExplorerView(account.currency), [account.currency]);
  return (address: string) => {
    const url =
      getValidatorExplorerUrl(account.currency.id, address) ||
      (explorerView && getAddressExplorer(explorerView, address));
    if (url) openURL(url);
  };
}

function useValidatorName(account: Account) {
  const validators = useMemo(
    () => (isStakingAccount(account) ? (account.stakingResources.validators ?? []) : []),
    [account],
  );
  return (address: string) => validators.find(v => v.validatorAddress === address)?.name ?? address;
}

function DelegateDetails({ operation, account }: { operation: Operation; account: Account }) {
  const unit = useAccountUnit(account);
  const openValidatorLink = useValidatorLink(account);
  const getValidatorName = useValidatorName(account);
  const [resolved, setResolved] = useState<{ validatorAddress: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveStakingValidator(account.currency, operation, "delegate").then(result => {
      if (!cancelled) setResolved(result);
    });
    return () => {
      cancelled = true;
    };
  }, [operation, account.currency]);

  if (!resolved) return null;

  const { validatorAddress } = resolved;

  return (
    <>
      <Divider />
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.delegatedTo" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Address onClick={() => openValidatorLink(validatorAddress)}>
            {getValidatorName(validatorAddress)}
          </Address>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.delegatedAmount" />
        </OpDetailsTitle>
        <OpDetailsData>
          {formatCurrencyUnit(unit, new BigNumber(operation.value), formatConfig)}
        </OpDetailsData>
      </OpDetailsSection>
    </>
  );
}

function UndelegateDetails({ operation, account }: { operation: Operation; account: Account }) {
  const unit = useAccountUnit(account);
  const openValidatorLink = useValidatorLink(account);
  const getValidatorName = useValidatorName(account);
  const [resolved, setResolved] = useState<{
    validatorAddress: string;
    amount: BigNumber | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveStakingValidator(account.currency, operation, "undelegate").then(result => {
      if (!cancelled) setResolved(result);
    });
    return () => {
      cancelled = true;
    };
  }, [operation, account.currency]);

  if (!resolved) return null;

  const { validatorAddress, amount } = resolved;

  return (
    <>
      <Divider />
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.undelegatedFrom" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Address onClick={() => openValidatorLink(validatorAddress)}>
            {getValidatorName(validatorAddress)}
          </Address>
        </OpDetailsData>
      </OpDetailsSection>
      <Divider />
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.undelegatedAmount" />
        </OpDetailsTitle>
        <OpDetailsData>
          {amount
            ? formatCurrencyUnit(unit, amount, formatConfig)
            : formatCurrencyUnit(unit, new BigNumber(operation.value), formatConfig)}
        </OpDetailsData>
      </OpDetailsSection>
    </>
  );
}

function RedelegateDetails({ operation, account }: { operation: Operation; account: Account }) {
  const unit = useAccountUnit(account);
  const openValidatorLink = useValidatorLink(account);
  const getValidatorName = useValidatorName(account);
  const [resolved, setResolved] = useState<{
    srcValidatorAddress: string;
    dstValidatorAddress: string;
    amount: BigNumber;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveRedelegationValidators(account.currency, operation).then(result => {
      if (!cancelled) setResolved(result);
    });
    return () => {
      cancelled = true;
    };
  }, [operation, account.currency]);

  if (!resolved) return null;

  const { srcValidatorAddress, dstValidatorAddress, amount } = resolved;

  return (
    <>
      <Divider />
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.redelegatedFrom" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Address onClick={() => openValidatorLink(srcValidatorAddress)}>
            {getValidatorName(srcValidatorAddress)}
          </Address>
        </OpDetailsData>
      </OpDetailsSection>
      <Divider />
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.redelegatedTo" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Address onClick={() => openValidatorLink(dstValidatorAddress)}>
            {getValidatorName(dstValidatorAddress)}
          </Address>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.redelegatedAmount" />
        </OpDetailsTitle>
        <OpDetailsData>{formatCurrencyUnit(unit, amount, formatConfig)}</OpDetailsData>
      </OpDetailsSection>
    </>
  );
}

function RedelegateAmountCell({ operation, unit, currency }: AmountCellExtraProps<Operation>) {
  const [amount, setAmount] = useState<BigNumber | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveRedelegationValidators(currency, operation).then(result => {
      if (!cancelled && result) setAmount(result.amount);
    });
    return () => {
      cancelled = true;
    };
  }, [operation, currency]);

  if (!amount || amount.isZero()) return null;

  return (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color="neutral.c80" />
      <CounterValue
        color="neutral.c70"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  );
}

function RedelegateFeeCell({ operation, unit, currency }: AmountCellExtraProps<Operation>) {
  const fee = operation.fee.negated();
  if (fee.isZero()) return null;

  return (
    <>
      <FormattedVal val={fee} unit={unit} showCode fontSize={4} color="neutral.c80" />
      <CounterValue
        color="neutral.c70"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={fee}
      />
    </>
  );
}

function OperationDetailsExtra({
  operation,
  account,
  type,
}: OperationDetailsExtraProps<Account, Operation>) {
  if (type === "DELEGATE") return <DelegateDetails operation={operation} account={account} />;
  if (type === "UNDELEGATE") return <UndelegateDetails operation={operation} account={account} />;
  if (type === "REDELEGATE") return <RedelegateDetails operation={operation} account={account} />;
  return null;
}

export const amountCellExtra = {
  REDELEGATE: RedelegateAmountCell,
};

export const amountCell = {
  REDELEGATE: RedelegateFeeCell,
};

export default OperationDetailsExtra;
