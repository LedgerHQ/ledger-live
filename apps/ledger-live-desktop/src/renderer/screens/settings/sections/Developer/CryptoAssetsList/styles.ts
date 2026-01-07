import styled from "styled-components";
import { Flex, Button } from "@ledgerhq/react-ui/index";

// ==================== Layout Styled Components ====================

export const DrawerContainer: ReturnType<typeof styled.div> = styled(Flex)`
  height: 100%;
  flex-direction: column;
  padding: 0;
`;

export const HeaderSection: ReturnType<typeof styled.div> = styled(Flex)`
  flex-direction: column;
  padding: 32px 24px 24px;
  background: ${p => p.theme.colors.background.default};
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
`;

export const ConfigSection: ReturnType<typeof styled.div> = styled(Flex)`
  flex-direction: column;
  row-gap: 16px;
  padding: 20px 24px;
  background: ${p => p.theme.colors.background.main};
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
`;

export const TokenListSection: ReturnType<typeof styled.div> = styled(Flex)`
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: ${p => p.theme.colors.background.main};
`;

// ==================== Collapsible Styled Components ====================

export const CollapsibleHeader: ReturnType<
  typeof styled.div<{
    collapsed?: boolean;
  }>
> = styled(Flex)<{
  collapsed?: boolean;
}>`
  padding: 10px 12px;
  background: ${p => p.theme.colors.background.default};
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 8px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: ${p => (p.collapsed ? "0" : "12px")};

  &:hover {
    background: ${p => p.theme.colors.opacityDefault.c10};
    border-color: ${p => p.theme.colors.primary.c60};
  }
`;

export const CollapsibleContent: ReturnType<
  typeof styled.div<{
    isOpen?: boolean;
  }>
> = styled(Flex)<{
  isOpen?: boolean;
}>`
  flex-direction: column;
  row-gap: 16px;
  overflow: hidden;
  max-height: ${p => (p.isOpen ? "2000px" : "0")};
  opacity: ${p => (p.isOpen ? "1" : "0")};
  transition:
    max-height 0.4s ease,
    opacity 0.3s ease;
  padding: ${p => (p.isOpen ? "12px 0 0 0" : "0")};
`;

// ==================== Form Styled Components ====================

export const StyledCheckbox: ReturnType<typeof styled.div> = styled(Flex)`
  align-items: center;
  column-gap: 12px;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${p => p.theme.colors.opacityDefault.c10};
  }
`;

export const MultiSelectContainer: ReturnType<typeof styled.div> = styled(Flex)`
  flex-direction: column;
  row-gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 8px;
  background: ${p => p.theme.colors.background.default};

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${p => p.theme.colors.neutral.c40};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${p => p.theme.colors.neutral.c60};
  }
`;

// ==================== Token Item Styled Components ====================

export const TokenItem: ReturnType<typeof styled.div<{ isExpanded?: boolean }>> = styled(Flex)<{
  isExpanded?: boolean;
}>`
  padding: 14px 16px;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 10px;
  flex-direction: column;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  background: ${p => p.theme.colors.background.default};
  cursor: pointer;

  &:hover {
    border-color: ${p => p.theme.colors.primary.c70};
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const TokenHeader: ReturnType<typeof styled.div> = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 12px;
`;

export const TokenNameContainer: ReturnType<typeof styled.div> = styled(Flex)`
  align-items: center;
  column-gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

export const TokenName = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
`;

export const TokenTicker = styled.span`
  white-space: nowrap;
  flex-shrink: 0;
`;

export const TokenTag: ReturnType<typeof styled.div> = styled(Flex)`
  padding: 4px 8px;
  border-radius: 4px;
  background: ${p => p.theme.colors.error.c10};
  align-items: center;
`;

export const TokenDetails: ReturnType<typeof styled.div> = styled(Flex)`
  flex-direction: column;
  row-gap: 12px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid ${p => p.theme.colors.neutral.c40};
`;

export const DetailRow: ReturnType<typeof styled.div> = styled(Flex)`
  flex-direction: column;
  row-gap: 4px;
`;

export const LoadMoreButton = styled(Button)`
  min-width: 200px;
`;

// ==================== New Layout Styled Components ====================

export const ParameterGroup: ReturnType<typeof styled.div> = styled(Flex)`
  flex-direction: column;
`;

export const ParameterGrid: ReturnType<typeof styled.div> = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const SectionDivider = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.neutral.c40};
  margin: 4px 0;
  opacity: 0.6;
`;
