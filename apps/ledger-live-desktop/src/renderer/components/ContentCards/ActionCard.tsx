import React from "react";
import styled from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";

type Props = {
  img: string;
  title: string;
  subtitle: string;
  actions: {
    cta: {
      label: string;
      fct: Function;
    };
    secondary: {
      label: string;
      fct: Function;
    };
  };
};

const CardContainer = styled.div`
  height: 64px;
  padding: 0px 16px 0px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const Header = styled.img`
  height: 36px;
  width: 36px;
  border-radius: 1000px;
  background-color: white;
`;

const Body = styled.div`
  height: 40px;
  flex-grow: 1;
  flex-basis: 0;
`;

const Title = styled.div`
  color: white;
  font-weight: 600;
  font-size: 14px;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Subtitle = styled.div`
  font-weight: 500;
  font-size: 13px;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionCard = ({ img, title, subtitle, actions }: Props) => {
  return (
    <CardContainer>
      <Header src={img} />
      <Body>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </Body>
      <Actions>
        <ButtonV3 big onClick={() => actions.secondary.fct()}>
          {actions.secondary.label}
        </ButtonV3>
        <ButtonV3 big variant="main" onClick={() => actions.secondary.fct()}>
          {actions.cta.label}
        </ButtonV3>
      </Actions>
    </CardContainer>
  );
};

export default ActionCard;
