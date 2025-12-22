import styled from "styled-components";
import ValidatorRow, { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";

export const Status = styled(Text)<{
  type?: string;
}>`
  font-size: 11px;
  font-weight: 700;
  color: ${p => (p.type === "active" ? p.theme.colors.positiveGreen : p.theme.colors.neutral.c70)};
`;
export const StyledValidatorRow = styled(ValidatorRow)<ValidatorRowProps>`
  border-color: transparent;
  margin-bottom: 0;
`;
export const ChosenMark = styled(Check).attrs<{
  active?: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.primary.c80 : "transparent",
  size: 14,
}))<{
  active?: boolean;
}>``;
