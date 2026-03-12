import { Flex } from "@ledgerhq/react-ui";
import { TransactionEditType } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import CheckBox from "~/renderer/components/CheckBox";
import Text from "~/renderer/components/Text";

const EditTypeWrapper = styled(Box)<{ selected: boolean }>`
  border: ${p =>
    `1px solid ${p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40}`};
  padding: 20px 16px;
  border-radius: 4px;
  &:hover {
    cursor: pointer;
  }
`;

const EditTypeHeader = styled(Box)<{ selected: boolean }>`
  color: ${p => (p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c70)};
  margin-left: 10px;
`;

const Description = styled(Box)<{ selected: boolean }>`
  color: ${p => (p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c70)};
  margin-top: 5px;
  margin-left: 15px;
  width: 400px;
`;

const getSpeedUpDescriptionKey = (
  haveFundToSpeedup: boolean,
  isOldestEditableOperation: boolean,
):
  | "operation.edit.speedUp.description"
  | "operation.edit.error.notEnoughFundsToSpeedup"
  | "operation.edit.error.notlowestNonceToSpeedup" => {
  if (!haveFundToSpeedup) {
    return "operation.edit.error.notEnoughFundsToSpeedup";
  }

  if (!isOldestEditableOperation) {
    return "operation.edit.error.notlowestNonceToSpeedup";
  }

  return "operation.edit.speedUp.description";
};

type Props = {
  editType?: TransactionEditType;
  haveFundToSpeedup: boolean;
  isOldestEditableOperation: boolean;
  canSpeedup: boolean;
  canCancel: boolean;
  ticker: string;
  learnMoreLabel: string;
  onSpeedupClick: () => void;
  onCancelClick: () => void;
  onLearnMoreClick: () => void;
};

export const SharedStepMethod = ({
  editType,
  haveFundToSpeedup,
  isOldestEditableOperation,
  canSpeedup,
  canCancel,
  ticker,
  learnMoreLabel,
  onSpeedupClick,
  onCancelClick,
  onLearnMoreClick,
}: Props) => {
  const isCancel = editType === "cancel";
  const isSpeedup = editType === "speedup";

  return (
    <Box flow={4}>
      <EditTypeWrapper key={0} selected={isSpeedup} onClick={onSpeedupClick}>
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox isChecked={isSpeedup} disabled={!canSpeedup} />
          <Box>
            <EditTypeHeader horizontal alignItems="center" selected={isSpeedup}>
              <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
                <Trans i18nKey={"operation.edit.speedUp.title"} />
              </Text>
            </EditTypeHeader>
            <Description selected={isSpeedup}>
              <Text ff="Inter|Medium" fontSize={12}>
                <Trans
                  i18nKey={getSpeedUpDescriptionKey(haveFundToSpeedup, isOldestEditableOperation)}
                />
              </Text>
            </Description>
          </Box>
        </Flex>
      </EditTypeWrapper>
      <EditTypeWrapper key={1} selected={isCancel} onClick={onCancelClick}>
        <Flex flexDirection="row" justifyContent="left" alignItems="center">
          <CheckBox isChecked={isCancel} disabled={!canCancel} />
          <Box>
            <EditTypeHeader horizontal alignItems="center" selected={isCancel}>
              <Text fontSize={14} ff="Inter|SemiBold" uppercase ml={1}>
                <Trans i18nKey={"operation.edit.cancel.title"} />
              </Text>
            </EditTypeHeader>
            <Description selected={isCancel}>
              <Text ff="Inter|Medium" fontSize={12}>
                {canCancel ? (
                  <Trans
                    i18nKey={"operation.edit.cancel.description"}
                    values={{
                      // note: ticker is always the main currency ticker
                      ticker,
                    }}
                  />
                ) : (
                  <Trans i18nKey={"operation.edit.error.notEnoughFundsToCancel"} />
                )}
              </Text>
            </Description>
          </Box>
        </Flex>
      </EditTypeWrapper>
      <Text
        ff="Inter|Medium"
        fontSize={12}
        style={{ textDecoration: "underline", textAlign: "center", cursor: "pointer" }}
        onClick={onLearnMoreClick}
      >
        {learnMoreLabel}
      </Text>
    </Box>
  );
};
