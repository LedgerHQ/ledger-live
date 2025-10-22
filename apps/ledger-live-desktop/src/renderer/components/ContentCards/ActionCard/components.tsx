import styled from "styled-components";

const CardContainer = styled.div`
  min-height: 64px;
  padding: 16px;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
`;

const Header = styled.img`
  height: 36px;
  width: 36px;
  border-radius: 1000px;
`;

const Body = styled.div`
  flex-grow: 1;
  flex-basis: 0;
`;

const Title = styled.div`
  color: ${p => p.theme.colors.neutral.c100};
  font-weight: 600;
  font-size: 14px;
`;

const Description = styled.div`
  font-weight: 500;
  font-size: 13px;
`;

const Actions = styled.div`
  display: flex;
  gap: 16px;
`;

export { CardContainer, Header, Body, Title, Description, Actions };
