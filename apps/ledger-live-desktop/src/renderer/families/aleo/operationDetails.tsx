import React from "react";
import { Trans } from "react-i18next";
import { Box, Text } from "@ledgerhq/react-ui/index";
import { getOperationDetailsExtraFields } from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoAccount,
  AleoOperation,
  AleoTransactionType,
} from "@ledgerhq/live-common/families/aleo/types";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import type { AmountCellExtraProps, OperationDetailsExtraProps } from "~/renderer/families/types";
import type { AleoFamily } from "./types";

type OperationDetails = NonNullable<AleoFamily["operationDetails"]>;

const mapFunctionIdToTranslationKey: Record<AleoTransactionType, string> = {
  public: "aleo.operations.type.public",
  private: "aleo.operations.type.private",
};

const CustomMetadataCell: OperationDetails["customMetadataCell"] = props => {
  const transactionType = props.operation.extra.transactionType;
  const translationKey = mapFunctionIdToTranslationKey[transactionType];

  if (!translationKey) {
    return null;
  }

  return (
    <Box width={90} data-testid="custom-metadata-cell">
      <Text color="neutral.c80" textAlign="center" display="block" variant="body" fontSize={3}>
        <Trans i18nKey={translationKey} />
      </Text>
    </Box>
  );
};

const OperationDetailsExtra = ({
  operation,
}: OperationDetailsExtraProps<AleoAccount, AleoOperation>) => {
  const extraFields = getOperationDetailsExtraFields(operation.extra);

  return (
    <>
      {extraFields.map(item => (
        <OpDetailsSection key={item.key}>
          <OpDetailsTitle>
            <Trans i18nKey={`operationDetails.extra.${item.key}`} defaults={item.key} />
          </OpDetailsTitle>
          <OpDetailsData>
            <Ellipsis>{item.value}</Ellipsis>
          </OpDetailsData>
        </OpDetailsSection>
      ))}
    </>
  );
};

const BondAmountCell = ({ operation, currency, unit }: AmountCellExtraProps<AleoOperation>) => {
  const amount = operation.extra.estimatedBondedAmount;
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
};

const UnbondAmountCell = ({ operation, currency, unit }: AmountCellExtraProps<AleoOperation>) => {
  const amount = operation.extra.estimatedUnbondedAmount;
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
};

const WithdrawUnbondedAmountCell = ({
  operation,
  currency,
  unit,
}: AmountCellExtraProps<AleoOperation>) => {
  const amount = operation.extra.estimatedWithdrawUnbondedAmount;
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
      <Text color="neutral.c70" fontSize={2}>
        <Trans i18nKey="aleo.operations.claimAmountEstimated" />
      </Text>
    </>
  );
};

const amountCellExtra: NonNullable<OperationDetails["amountCellExtra"]> = {
  BOND: BondAmountCell,
  UNBOND: UnbondAmountCell,
  WITHDRAW_UNBONDED: WithdrawUnbondedAmountCell,
};

export default {
  customMetadataCell: CustomMetadataCell,
  OperationDetailsExtra,
  amountCellExtra,
};
