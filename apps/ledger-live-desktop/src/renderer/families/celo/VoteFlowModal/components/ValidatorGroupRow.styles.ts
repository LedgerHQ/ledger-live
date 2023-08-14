import styled from "styled-components";
import ValidatorRow, { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";
import Check from "~/renderer/icons/Check";

export const StyledValidatorRow = styled(ValidatorRow)<ValidatorRowProps>`
  border-color: transparent;
  margin-bottom: 0;
`;
export const ChosenMark = styled(Check).attrs<{
  active: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))<{
  active: boolean;
}>``;
