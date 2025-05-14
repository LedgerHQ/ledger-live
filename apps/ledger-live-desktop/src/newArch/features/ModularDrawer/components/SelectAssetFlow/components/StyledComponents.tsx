import styled from "styled-components";

export const SelectAssetFlowContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
`;

export const SelectorContent = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  margin: 0 16px;
  height: 100%;
`;

export const HeaderContainer = styled.div`
  padding: 54px 0 16px 24px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
`;

export const SearchContainer = styled.div`
  padding: 0 0 16px 0;
  flex: 0 1 auto;
`;

export const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: absolute;
  top: 20px;
  left: 16px;
  z-index: 1000;
  pointer-events: all;
  &:hover {
    background-color: ${p => p.theme.colors.palette.neutral.c30};
  }
`;
