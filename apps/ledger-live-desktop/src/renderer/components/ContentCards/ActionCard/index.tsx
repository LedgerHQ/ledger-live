import React from "react";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { Actions, Body, CardContainer, Header, Subtitle, Title } from "./components";

type Props = {
  img: string;

  title: string;
  subtitle: string;

  actions: {
    primary: {
      label: string;
      fct: Function;
    };
    secondary: {
      label: string;
      fct: Function;
    };
  };
};

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
        <ButtonV3 big variant="main" onClick={() => actions.primary.fct()}>
          {actions.primary.label}
        </ButtonV3>
      </Actions>
    </CardContainer>
  );
};

export default ActionCard;
