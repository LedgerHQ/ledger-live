/* eslint-disable consistent-return */
import startCase from "lodash/startCase";
import React, { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { OperationType } from "@ledgerhq/types-live";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { openURL } from "~/renderer/linking";
import {
  OpDetailsTitle,
  Address,
  OpDetailsData,
  OpDetailsVoteData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/families/polkadot/react";
import { PolkadotAccount, PolkadotOperation } from "@ledgerhq/live-common/families/polkadot/types";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { urls } from "~/config/urls";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import { AmountCellExtraProps, OperationDetailsExtraProps } from "../types";

function getURLFeesInfo({
  op,
}: {
  op: PolkadotOperation;
  currencyId: string;
}): string | undefined | null {
  if (op.fee.gt(200000)) {
    return urls.polkadotFeesInfo;
  }
}
function getURLWhatIsThis({
  op,
}: {
  op: PolkadotOperation;
  currencyId: string;
}): string | undefined | null {
  if (op.type !== "IN" && op.type !== "OUT") {
    return urls.stakingPolkadot;
  }
}
function formatPalletMethod(palletMethod?: string | null): string {
  if (!palletMethod) return "";
  return palletMethod.split(".").map(startCase).join(" - ");
}
const redirectAddress = (currency: Currency, address: string) => () => {
  const url =
    currency.type === "CryptoCurrency" &&
    getAddressExplorer(getDefaultExplorerView(currency), address);
  if (url) openURL(url);
};
type OperationDetailsValidatorsProps = {
  validators: string[];
  account: PolkadotAccount;
  isTransactionField?: boolean;
};
export const OperationDetailsValidators = ({
  validators,
  account,
  isTransactionField,
}: OperationDetailsValidatorsProps) => {
  const { currency } = account;
  const { validators: polkadotValidators } = usePolkadotPreloadData();
  const mappedValidators = useMemo(
    () =>
      (validators || [])
        .map(address => polkadotValidators.find(v => v.address === address)!)
        .filter(Boolean),
    [validators, polkadotValidators],
  );
  return (
    <OpDetailsSection>
      {!isTransactionField && (
        <OpDetailsTitle>
          <Trans
            i18nKey={"operationDetails.extra.validatorsCount"}
            values={{
              number: mappedValidators.length,
            }}
          />
        </OpDetailsTitle>
      )}
      <Box flex="1" pl={2}>
        {mappedValidators.map(({ address, identity }, i) => (
          <OpDetailsData key={address + i} justifyContent="flex-start">
            <OpDetailsVoteData>
              <Box>
                <Text ff="Inter|SemiBold">{identity ?? address}</Text>
              </Box>
              <Address onClick={redirectAddress(currency, address)}>
                <SplitAddress value={address} />
              </Address>
            </OpDetailsVoteData>
          </OpDetailsData>
        ))}
      </Box>
    </OpDetailsSection>
  );
};
type OperationDetailsRewardFromProps = {
  validatorStash: string;
  account: PolkadotAccount;
};
export const OperationDetailsRewardFrom = ({
  validatorStash,
  account,
}: OperationDetailsRewardFromProps) => {
  const { currency } = account;
  const { validators: polkadotValidators } = usePolkadotPreloadData();
  const validator = useMemo(
    () => polkadotValidators.find(v => v.address === validatorStash),
    [validatorStash, polkadotValidators],
  );
  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"operationDetails.extra.rewardFrom"} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Address onClick={redirectAddress(currency, validatorStash)}>
          {validator ? validator.identity ?? validator.address : validatorStash}
        </Address>
      </OpDetailsData>
    </OpDetailsSection>
  );
};
type OperationDetailsPalletMethodProps = {
  palletMethod: string;
};
export const OperationDetailsPalletMethod = ({
  palletMethod,
}: OperationDetailsPalletMethodProps) => {
  return !palletMethod ? (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"operationDetails.extra.palletMethod"} />
      </OpDetailsTitle>
      <OpDetailsData>{formatPalletMethod(palletMethod)}</OpDetailsData>
    </OpDetailsSection>
  ) : null;
};

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<PolkadotAccount, PolkadotOperation>) => {
  const { extra } = operation;
  switch (type) {
    case "OUT":
    case "IN":
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.transferAmount" />
            </OpDetailsTitle>
            <OpDetailsData>
              <Box>
                <FormattedVal
                  val={extra.transferAmount ?? new BigNumber(0)}
                  unit={account.unit}
                  disableRounding={true}
                  showCode
                  fontSize={4}
                  color="palette.text.shade60"
                />
              </Box>
            </OpDetailsData>
          </OpDetailsSection>
        </>
      );
    case "NOMINATE": {
      const { validators } = extra;
      if (!validators || !validators.length) return null;
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <OperationDetailsValidators validators={validators} account={account} />
        </>
      );
    }
    case "BOND":
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          {extra.bondedAmount ? (
            <OpDetailsSection>
              <OpDetailsTitle>
                <Trans i18nKey="operationDetails.extra.bondedAmount" />
              </OpDetailsTitle>
              <OpDetailsData>
                <Box>
                  <FormattedVal
                    val={extra.bondedAmount}
                    unit={account.unit}
                    disableRounding={true}
                    showCode
                    fontSize={4}
                    color="palette.text.shade60"
                  />
                </Box>
              </OpDetailsData>
            </OpDetailsSection>
          ) : null}
        </>
      );
    case "UNBOND":
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.unbondedAmount" />
            </OpDetailsTitle>
            <OpDetailsData>
              <Box>
                <FormattedVal
                  val={extra.unbondedAmount ?? new BigNumber(0)}
                  unit={account.unit}
                  disableRounding={true}
                  showCode
                  fontSize={4}
                  color="palette.text.shade60"
                />
              </Box>
            </OpDetailsData>
          </OpDetailsSection>
        </>
      );
    case "WITHDRAW_UNBONDED":
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.withdrawUnbondedAmount" />
            </OpDetailsTitle>
            <OpDetailsData>
              <Box>
                <FormattedVal
                  val={BigNumber(extra.withdrawUnbondedAmount ?? new BigNumber(0))}
                  unit={account.unit}
                  disableRounding={true}
                  showCode
                  fontSize={4}
                  color="palette.text.shade60"
                />
              </Box>
            </OpDetailsData>
          </OpDetailsSection>
        </>
      );
    case "REWARD_PAYOUT":
      return (
        <>
          <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />
          {extra.validatorStash ? (
            <OperationDetailsRewardFrom validatorStash={extra.validatorStash} account={account} />
          ) : null}
        </>
      );
    default:
      return <OperationDetailsPalletMethod palletMethod={extra.palletMethod} />;
  }
};

const BondAmountCell = ({ operation, currency, unit }: AmountCellExtraProps<PolkadotOperation>) => {
  const amount = new BigNumber(operation.extra.bondedAmount ?? 0);
  return !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"palette.text.shade80"} />

      <CounterValue
        color="palette.text.shade60"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  ) : null;
};
const UnbondAmountCell = ({
  operation,
  currency,
  unit,
}: AmountCellExtraProps<PolkadotOperation>) => {
  const amount = operation.extra.unbondedAmount ?? new BigNumber(0);
  return !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"palette.text.shade80"} />

      <CounterValue
        color="palette.text.shade60"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  ) : null;
};
const WithdrawUnbondedAmountCell = ({
  operation,
  currency,
  unit,
}: AmountCellExtraProps<PolkadotOperation>) => {
  const amount = operation.extra.withdrawUnbondedAmount ?? new BigNumber(0);
  return !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"palette.text.shade80"} />

      <CounterValue
        color="palette.text.shade60"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  ) : null;
};
const NominateAmountCell = ({ operation }: AmountCellExtraProps<PolkadotOperation>) => {
  const discreet = useDiscreetMode();
  const amount = operation.extra?.validators?.length || 0;
  return amount > 0 ? (
    <Text ff="Inter|SemiBold" fontSize={4}>
      <Trans
        i18nKey={"operationDetails.extra.validatorsCount"}
        values={{
          number: !discreet ? amount : "***",
        }}
      />
    </Text>
  ) : null;
};

const amountCellExtra: Partial<
  Record<OperationType, React.ComponentType<AmountCellExtraProps<PolkadotOperation>>>
> = {
  BOND: BondAmountCell,
  UNBOND: UnbondAmountCell,
  NOMINATE: NominateAmountCell,
  WITHDRAW_UNBONDED: WithdrawUnbondedAmountCell,
};

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};
