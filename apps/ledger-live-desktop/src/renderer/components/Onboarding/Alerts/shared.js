import styled from "styled-components";

export const AlertIconContainer = styled.div`
  color: #8a80db;
  background-color: #8a80db20;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 50px;
`;

export const AlertModalContainer = styled.div`
  width: 480px;
  display: flex;
  flex-direction: column;
  padding: 56px 104px;
  align-items: center;
  text-align: center;
  background-color: ${p => p.theme.colors.palette.background.default};
`;
