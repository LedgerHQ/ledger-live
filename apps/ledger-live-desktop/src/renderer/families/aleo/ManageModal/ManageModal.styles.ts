import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const ManageButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  width: 100%;
  background: transparent;
  cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${p => (p.disabled ? 0.5 : 1)};
  &:hover {
    background: ${p => (p.disabled ? "transparent" : p.theme.colors.neutral.c20)};
  }
`;

export const IconWrapper = styled(Box)`
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: ${p => p.theme.colors.neutral.c20};
  color: ${p => p.theme.colors.neutral.c100};
  margin-right: 12px;
`;

export const InfoWrapper = styled(Box)`
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 1;
  text-align: left;
`;

export const Title = styled(Box)`
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.theme.colors.neutral.c100};
`;

export const Description = styled(Box)`
  font-size: 13px;
  color: ${p => p.theme.colors.neutral.c70};
`;
