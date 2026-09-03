import React from "react";
import { Trans } from "react-i18next";
import { Box, Text } from "@ledgerhq/react-ui/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getOperationDetailsExtraFields } from "@ledgerhq/live-common/families/aleo/utils";
import type {
  AleoAccount,
  AleoOperation,
  AleoTransactionType,
} from "@ledgerhq/live-common/families/aleo/types";
import { useSelector } from "LLD/hooks/redux";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import Ellipsis from "~/renderer/components/Ellipsis";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import {
  GradientHover,
  HashContainer,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
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

const STAKED_AMOUNT_LABEL: Partial<Record<string, string>> = {
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
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
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
      {stakedAmount && stakedAmountLabel && (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={stakedAmountLabel} />
          </OpDetailsTitle>
          <OpDetailsData>
            {formatCurrencyUnit(unit, stakedAmount, {
              disableRounding: true,
              alwaysShowSign: false,
              showCode: true,
              discreet,
              locale,
            })}
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
