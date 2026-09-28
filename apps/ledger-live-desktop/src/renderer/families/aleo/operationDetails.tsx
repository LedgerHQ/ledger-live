import React from "react";
import { Trans } from "react-i18next";
import { Box, Text } from "@ledgerhq/react-ui/index";
import { getOperationDetailsExtraFields } from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoAccount,
  AleoOperation,
  AleoTransactionType,
} from "@ledgerhq/live-common/families/aleo/types";
import type { OperationType } from "@ledgerhq/types-live";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedVal from "~/renderer/components/FormattedVal";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import {
  GradientHover,
  HashContainer,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
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

const STAKED_AMOUNT_LABEL: Partial<Record<OperationType, string>> = {
  BOND: "aleo.operationDetails.extra.bondedAmount",
  UNBOND: "aleo.operationDetails.extra.unbondedAmount",
};

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<AleoAccount, AleoOperation>) => {
  const extraFields = getOperationDetailsExtraFields(operation.extra);
  const unit = useAccountUnit(account);
  const { validator, stakedAmount } = operation.extra;
  const stakedAmountLabel = STAKED_AMOUNT_LABEL[type];

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
      {validator && (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey="aleo.operationDetails.extra.validator" />
          </OpDetailsTitle>
          <OpDetailsData relative horizontal data-testid="operation-validator">
            <HashContainer>
              <SplitAddress value={validator} />
            </HashContainer>
            <GradientHover>
              <CopyWithFeedback text={validator} />
            </GradientHover>
          </OpDetailsData>
        </OpDetailsSection>
      )}
      {stakedAmount !== undefined && stakedAmountLabel && (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={stakedAmountLabel} />
          </OpDetailsTitle>
          <OpDetailsData>
            <Box>
              <FormattedVal
                val={stakedAmount}
                unit={unit}
                disableRounding
                showCode
                color="neutral.c80"
              />
            </Box>
          </OpDetailsData>
        </OpDetailsSection>
      )}
    </>
  );
};

export default {
  customMetadataCell: CustomMetadataCell,
  OperationDetailsExtra,
};
