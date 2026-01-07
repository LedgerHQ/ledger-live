import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Link from "~/renderer/components/Link";
export const OpDetailsSection = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "flex-start",
  justifyContent: "space-between",
  ff: "Inter|SemiBold",
  fontSize: 4,
  color: "neutral.c70",
}))``;
export const OpDetailsTitle = styled(Box).attrs<{ horizontal?: boolean }>(p => ({
  ff: "Inter|SemiBold",
  fontSize: 3,
  color: "neutral.c100",
  horizontal: p.horizontal || true,
}))`
  justify-content: center;
  min-height: 30px;
  letter-spacing: 2px;
  line-height: 30px;
`;
export const Address = styled(Text)`
  margin-left: -4px;
  border-radius: 4px;
  flex-wrap: wrap;
  padding: 4px;
  width: fit-content;
  max-width: 100%;
  display: inline-block;
  word-break: break-all;
`;
export const GradientHover = styled(Box).attrs(() => ({
  alignItem: "center",
  justifyContent: "center",
  color: "wallet",
}))`
  background: ${p => p.theme.colors.background.card};
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-left: 20px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0),
    ${p => p.theme.colors.background.card} 20%
  );
`;
export const OpDetailsData = styled(Box).attrs<{ justifyContent?: string; alignItems?: string }>(
  p => ({
    ff: "Inter",
    color: p.color || "neutral.c80",
    fontSize: 3,
    relative: true,
    flex: 1,
    horizontal: true,
    justifyContent: p.justifyContent || "flex-end",
    alignItems: p.alignItems || "center",
  }),
)`
  min-height: 30px;
  max-width: 100%;
  ${GradientHover} {
    display: none;
  }

  &:hover ${GradientHover} {
    display: flex;
    & > * {
      cursor: pointer;
    }
  }

  &:hover ${Address} {
    background: ${p => p.theme.colors.pillActiveBackground};
    color: ${p => p.theme.colors.primary.c80};
    font-weight: 400;
  }

  & ${Link}:hover {
    text-decoration: underline;
  }
`;

export const TextEllipsis = styled.div`
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const Separator = styled.div`
  margin: 0 4px;
`;
export const OpDetailsVoteData = styled.blockquote`
  max-width: 100%;
  margin-bottom: 13px;
  padding-left: 10px;
  border-left: 4px solid currentColor;
  ${Address} {
    cursor: pointer;
  }
`;
export const HashContainer = styled.div`
  width: 100%;
  word-break: break-all;
  user-select: text;
  padding-left: 50px;
  height: 30px;
  line-height: 30px;
`;
export const OpDetailsSideButton = styled(Box).attrs(() => ({
  horizontal: true,
  justifyContent: "flex-end",
  alignItems: "center",
}))`
  cursor: pointer;
`;
