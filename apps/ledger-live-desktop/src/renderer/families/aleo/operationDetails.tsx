import React from "react";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import { Box, Text } from "@ledgerhq/react-ui/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { getOperationDetailsExtraFields } from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoAccount,
  AleoOperation,
  AleoTransactionType,
} from "@ledgerhq/live-common/families/aleo/types";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import type { OperationDetailsExtraProps } from "~/renderer/families/types";
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

// getOperationAmountNumber renders -fee for all stake-family types; that is right for UNBOND
// (contract interaction, no balance delta) but not for BOND (funds leave to the validator) or
// WITHDRAW_UNBONDED (funds come back). Failed staking txs only ever cost the fee.
const getAmount = (operation: AleoOperation): BigNumber => {
  if (operation.hasFailed) {
    return getOperationAmountNumber(operation);
  }

  switch (operation.type) {
    case "BOND": {
      const amount = operation.extra.estimatedBondedAmount;
      return amount && !amount.isZero() ? amount.negated() : getOperationAmountNumber(operation);
    }
    case "WITHDRAW_UNBONDED": {
      const amount = operation.extra.estimatedWithdrawUnbondedAmount;
      return amount && !amount.isZero() ? amount : getOperationAmountNumber(operation);
    }
    default:
      return getOperationAmountNumber(operation);
  }
};

export default {
  customMetadataCell: CustomMetadataCell,
  OperationDetailsExtra,
  getAmount,
};
