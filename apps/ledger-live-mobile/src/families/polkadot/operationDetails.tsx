import React, { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import startCase from "lodash/startCase";
import { BigNumber } from "bignumber.js";

import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/families/polkadot/react";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import { Text } from "@ledgerhq/native-ui";
import { PolkadotValidator } from "@ledgerhq/live-common/families/polkadot/types";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import Section from "../../screens/OperationDetails/Section";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";
import { urls } from "../../config/urls";

import BondIcon from "../../icons/LinkIcon";
import UnbondIcon from "../../icons/Undelegate";
import WithdrawUnbondedIcon from "../../icons/Coins";
import RewardIcon from "../../icons/ClaimReward";
import NominateIcon from "../../icons/Vote";
import ChillIcon from "../../icons/VoteNay";
import SetControllerIcon from "../../icons/Manager";

import OperationStatusWrapper from "../../icons/OperationStatusIcon/Wrapper";

import NominationInfo from "./components/NominationInfo";

function getURLWhatIsThis(
  op: Operation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currencyId: string,
): string | undefined {
  if (op.type !== "IN" && op.type !== "OUT") {
    return urls.polkadotStaking;
  }
  return undefined;
}

function formatPalletMethod(palletMethod?: string): string {
  if (!palletMethod) return "";

  return palletMethod.split(".").map(startCase).join(" - ");
}

type OperationDetailsExtraProps = {
  extra: {
    palletMethod: string;
    validators: string[];
    transferAmount: BigNumber;
    bondedAmount: BigNumber;
    unbondedAmount: BigNumber;
    withdrawUnbondedAmount: BigNumber;
    validatorStash: string;
  };
  type: string;
  account: Account;
};

function OperationDetailsExtra({
  extra,
  type,
  account,
}: OperationDetailsExtraProps) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);

  switch (type) {
    case "OUT":
    case "IN": {
      const value = formatCurrencyUnit(
        account.unit,
        BigNumber(extra.transferAmount),
        {
          showCode: true,
          discreet,
          disableRounding: true,
          locale,
        },
      );
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <Section
            title={t("operationDetails.extra.transferAmount")}
            value={value}
          />
        </>
      );
    }
    case "NOMINATE": {
      const { validators } = extra;
      if (!validators || !validators.length) return null;

      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <OperationDetailsValidators
            validators={validators}
            account={account}
          />
        </>
      );
    }
    case "BOND": {
      const value = formatCurrencyUnit(
        account.unit,
        BigNumber(extra.bondedAmount),
        {
          showCode: true,
          discreet,
          disableRounding: true,
          locale,
        },
      );
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <Section
            title={t("operationDetails.extra.bondedAmount")}
            value={value}
          />
        </>
      );
    }
    case "UNBOND": {
      const value = formatCurrencyUnit(
        account.unit,
        BigNumber(extra.unbondedAmount),
        {
          showCode: true,
          discreet,
          disableRounding: true,
          locale,
        },
      );
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <Section
            title={t("operationDetails.extra.unbondedAmount")}
            value={value}
          />
        </>
      );
    }
    case "WITHDRAW_UNBONDED": {
      const value = formatCurrencyUnit(
        account.unit,
        BigNumber(extra.withdrawUnbondedAmount),
        {
          showCode: true,
          discreet,
          disableRounding: true,
          locale,
        },
      );
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <Section
            title={t("operationDetails.extra.withdrawUnbondedAmount")}
            value={value}
          />
        </>
      );
    }
    case "REWARD_PAYOUT": {
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          {extra.validatorStash ? (
            <OperationDetailsRewardFrom
              validatorStash={extra.validatorStash}
              account={account}
            />
          ) : null}
        </>
      );
    }
    default:
      return <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />;
  }
}
type OperationDetailsRewardFromProps = {
  validatorStash: string;
  account: Account;
  isTransactionField?: boolean;
};

export const OperationDetailsRewardFrom = ({
  validatorStash,
  account,
}: OperationDetailsRewardFromProps) => {
  const { t } = useTranslation();

  const { validators: polkadotValidators } = usePolkadotPreloadData();

  const validator = useMemo(
    () => polkadotValidators.find(v => v.address === validatorStash),
    [validatorStash, polkadotValidators],
  );

  const redirectAddressCreator = useCallback(
    address => () => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account],
  );

  return (
    <Section
      title={t("operationDetails.extra.rewardFrom")}
      value={
        validator ? validator.identity ?? validator.address : validatorStash
      }
      onPress={redirectAddressCreator(validatorStash)}
    />
  );
};

type OperationDetailsPalletMethodProps = {
  palletMethod: string;
};

export const OperationDetailsPalletMethod = ({
  palletMethod,
}: OperationDetailsPalletMethodProps) => {
  const { t } = useTranslation();

  return palletMethod ? (
    <Section
      title={t("operationDetails.extra.palletMethod")}
      value={formatPalletMethod(palletMethod)}
    />
  ) : null;
};

type OperationDetailsValidatorsProps = {
  validators: string[];
  account: Account;
};

export function OperationDetailsValidators({
  validators,
  account,
}: OperationDetailsValidatorsProps) {
  const { t } = useTranslation();
  const { validators: polkadotValidators } = usePolkadotPreloadData();

  const mappedValidators = useMemo(
    () =>
      (validators || [])
        .map<PolkadotValidator>(
          address =>
            polkadotValidators.find(
              v => v.address === address,
            ) as PolkadotValidator,
        )
        .filter(Boolean),
    [validators, polkadotValidators],
  );

  const redirectAddressCreator = useCallback(
    address => () => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account],
  );

  return (
    <Section
      title={t("operationDetails.extra.validatorsCount", {
        number: validators.length,
      })}
    >
      {mappedValidators &&
        mappedValidators.map(({ address, identity }, i) => (
          <NominationInfo
            key={address + i}
            address={address}
            identity={identity}
            onPress={redirectAddressCreator(address)}
          />
        ))}
    </Section>
  );
}

type Props = {
  operation: Operation;
  currency: Currency;
  unit: Unit;
};

const AmountCell = ({
  amount,
  unit,
  currency,
  operation,
}: Props & { amount: BigNumber }) =>
  !amount.isZero() ? (
    <>
      <Text
        numberOfLines={1}
        color={"neutral.c100"}
        variant="body"
        fontWeight="semiBold"
      >
        <CurrencyUnitValue
          showCode
          unit={unit}
          value={amount}
          alwaysShowSign={false}
        />
      </Text>

      <Text variant="paragraph" fontWeight="medium" color="neutral.c70">
        <CounterValue
          showCode
          date={operation.date}
          currency={currency}
          value={amount}
          alwaysShowSign={false}
          withPlaceholder
        />
      </Text>
    </>
  ) : null;

const BondAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = new BigNumber(
    operation.extra ? operation.extra.bondedAmount : 0,
  );

  return (
    <AmountCell
      amount={amount}
      operation={operation}
      currency={currency}
      unit={unit}
    />
  );
};

const UnbondAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = new BigNumber(
    operation.extra ? operation.extra.unbondedAmount : 0,
  );

  return (
    <AmountCell
      amount={amount}
      operation={operation}
      currency={currency}
      unit={unit}
    />
  );
};

const WithdrawUnbondAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = new BigNumber(
    operation.extra ? operation.extra.withdrawUnbondedAmount : 0,
  );

  return (
    <AmountCell
      amount={amount}
      operation={operation}
      currency={currency}
      unit={unit}
    />
  );
};

const NominateAmountCell = ({ operation }: Props) => {
  const amount = operation.extra?.validators?.length || 0;

  return amount > 0 ? (
    <Text numberOfLines={1} variant={"paragraph"} fontWeight={"semiBold"}>
      <Trans
        i18nKey={"operationDetails.extra.validatorsCount"}
        values={{ number: amount }}
      />
    </Text>
  ) : null;
};

const createOperationIcon =
  (Icon: React.ComponentType<{ size?: number; color?: string }>) =>
  ({
    confirmed,
    failed,
    size = 24,
    type,
  }: {
    confirmed?: boolean;
    failed?: boolean;
    size?: number;
    type: OperationType;
  }) =>
    (
      <OperationStatusWrapper
        size={size}
        Icon={Icon}
        confirmed={confirmed}
        failed={failed}
        type={type}
      />
    );

const amountCell = {
  BOND: BondAmountCell,
  UNBOND: UnbondAmountCell,
  NOMINATE: NominateAmountCell,
  WITHDRAW_UNBONDED: WithdrawUnbondAmountCell,
};

const operationStatusIcon = {
  BOND: createOperationIcon(BondIcon),
  UNBOND: createOperationIcon(UnbondIcon),
  CHILL: createOperationIcon(ChillIcon),
  SET_CONTROLLER: createOperationIcon(SetControllerIcon),
  NOMINATE: createOperationIcon(NominateIcon),
  WITHDRAW_UNBONDED: createOperationIcon(WithdrawUnbondedIcon),
  REWARD_PAYOUT: createOperationIcon(RewardIcon),
};

export default {
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCell,
  operationStatusIcon,
};
