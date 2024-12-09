import React, { useState, useEffect } from "react";
import Input, { Props as InputBaseProps } from "~/renderer/components/Input";
import { useDebounce } from "@ledgerhq/live-common//hooks/useDebounce";
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
  color: ${({ theme }) => theme.colors.primary.c80};
  margin-top: 6px;
  font-size: 12px;
  line-height: normal;
`;

type MemoTagFieldProps = InputBaseProps & {
  maxMemoLength?: number;
  showLabel?: boolean;
  CaracterCountComponent?: React.FC;
  autoFocus?: boolean;
  placeholder?: string;
  label?: string;
  tooltipText?: string;
  validationHandler?: (newValue: string) => string;
};

const MemoTagField = ({
  warning,
  error,
  value,
  onChange,
  showLabel = true,
  maxMemoLength,
  CaracterCountComponent,
  autoFocus,
  placeholder,
  label,
  tooltipText,
  validationHandler,
}: MemoTagFieldProps) => {
  const { t } = useTranslation();
  const [memoValue, setMemoValue] = useState(value);
  const debouncedMemoValue = useDebounce(memoValue, 300);

  useEffect(() => {
    if (debouncedMemoValue !== value) onChange?.(debouncedMemoValue || "");
  }, [debouncedMemoValue, onChange, value]);

  const handleChange = (newValue: string) => {
    setMemoValue(validationHandler ? validationHandler(newValue) : newValue);
  };

  return (
    <Box flow={1}>
      {showLabel && (
        <Label>
          <Flex>
            <span>{label ?? t("MemoTagField.label")}</span>
            &nbsp;&nbsp;
            <Tooltip
              placement="top"
              content={
                <TooltipContainer>{tooltipText ?? t("MemoTagField.information")}</TooltipContainer>
              }
            >
              <InfoCircle size={16} data-testid="memo-tag-field-tooltip-icon" />
            </Tooltip>
          </Flex>
        </Label>
      )}
      <Flex flexDirection="column" justifyContent="center">
        <Flex justifyContent="end">{CaracterCountComponent && <CaracterCountComponent />}</Flex>
        <Input
          placeholder={placeholder ?? t("MemoTagField.placeholder")}
          onChange={handleChange}
          warning={warning}
          error={error}
          value={memoValue}
          spellCheck="false"
          ff="Inter"
          maxMemoLength={maxMemoLength}
          autoFocus={autoFocus}
          data-testid="memo-tag-input"
        />
        {!warning && !error && autoFocus && (
          <InstructionText>{t("MemoTagField.instruction")}</InstructionText>
        )}
      </Flex>
    </Box>
  );
};

export default MemoTagField;
