import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";

export const Description = styled(Text).attrs<{
  isPill?: boolean;
}>(({ isPill }) => ({
  ff: isPill ? "Inter|SemiBold" : "Inter|Regular",
  fontSize: isPill ? 2 : 3,
  color: "palette.text.shade60",
}))<{
  isPill?: boolean;
}>`
  ${p =>
    p.isPill
      ? `
    text-transform: uppercase;
  `
      : ""}
`;
export const SelectResource = styled(Box).attrs(() => ({
  horizontal: true,
  p: 3,
  mt: 2,
  alignItems: "center",
  justifyContent: "space-between",
}))<{
  disabled?: boolean;
}>`
  height: 58px;
  border: 1px solid ${p => p.theme.colors.palette.text.shade20};
  border-radius: 4px;
  ${p =>
    p.disabled
      ? `
          opacity: 0.7;
          cursor: auto;
        `
      : ``}
`;
export const TimerWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  ff: "Inter|Medium",
  fontSize: 3,
  color: "palette.text.shade60",
  bg: "palette.text.shade10",
  borderRadius: 4,
  p: 1,
  mr: 4,
}))`
  align-self: center;

  ${Description} {
    margin-left: 5px;
  }
`;
