import React, { ReactElement } from "react";
import Input, { Props as InputBaseProps } from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";
import Box from "~/renderer/components/Box";
import { useTranslation } from "react-i18next";
import { Flex, Text, Tooltip } from "@ledgerhq/react-ui";
import styled from "styled-components";
import InfoCircle from "~/renderer/icons/InfoCircle";

const TooltipContainer = styled(Box)`
  background-color: ${({ theme }) => theme.colors.palette.neutral.c100};
  padding: 10px;
  border-radius: 4px;
  display: flex;
  gap: 8px;
`;

const InstructionText = styled(Text)`
  color: ${({ theme }) => theme.colors.palette.text.shade60};
  margin-top: 1px;
  font-size: 12px;
`;

type MemoTagFieldProps = InputBaseProps & {
  maxMemoLength?: number;
  showLabel?: boolean;
  CaracterCountComponent?: React.FC;
};

const MemoTagField = ({
  warning,
  error,
  value,
  onChange,
  showLabel = true,
  maxMemoLength,
  CaracterCountComponent
}: MemoTagFieldProps) => {
  const { t } = useTranslation();
  return (
    <Box flow={1}>
      {showLabel && (
        <Label>
          <Flex>
            <span>{t("MemoTagField.label")}</span>
            &nbsp;&nbsp;
            <Tooltip
              placement="top"
              content={<TooltipContainer>{t("MemoTagField.info")}</TooltipContainer>}
            >
              <InfoCircle size={16} />
            </Tooltip>
          </Flex>
        </Label>
      )}
      <Flex flexDirection="column" justifyContent="center">
        {CaracterCountComponent && <CaracterCountComponent />}
        <Input
          placeholder={t("MemoTagField.placeholder")}
          onChange={onChange}
          warning={warning}
          error={error}
          value={value}
          spellCheck="false"
          ff="Inter"
          maxMemoLength={maxMemoLength}
        />
        <InstructionText>{t("MemoTagField.instruction")}</InstructionText>
      </Flex>
    </Box>
  );
};

export default MemoTagField;

/**
 * <Box flow={1}>
      <Label>
        <Flex>
          <span>{t("MemoTagField.label")}</span>
          &nbsp;&nbsp;
          <Tooltip
            placement="top"
            content={<TooltipContainer>{t("MemoTagField.info")}</TooltipContainer>}
          >
            <InfoCircle size={16} />
          </Tooltip>
        </Flex>
      </Label>
      <Flex flexDirection="column" justifyContent="center">
        <Input placeholder={t("MemoTagField.placeholder")} value={value} onChange={onChange} />
        <InstructionText>{t("MemoTagField.instruction")}</InstructionText>
      </Flex>
    </Box>
 */
