import React from "react";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { Actions, Body, CardContainer, Header, Description, Title } from "./components";
import { Link } from "@ledgerhq/react-ui";
import { ContentCardBuilder } from "~/renderer/components/ContentCards/utils";

type Props = {
  img?: string;

  title: string;
  description: string;

  actions: {
    primary: {
      label?: string;
      action: Function;
    };
    dismiss: {
      label: string;
      action: Function;
    };
  };
};

const ActionCard = ({ img, title, description, actions }: Props) => {
  return (
    <CardContainer>
      {img && <Header src={img} />}
      <Body>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Body>
      <Actions>
        <Link size="small" onClick={() => actions.dismiss.action()}>
          {actions.dismiss.label}
        </Link>

        {actions.primary.label && (
          <ButtonV3 big variant="main" onClick={() => actions.primary.action()}>
            {actions.primary.label}
          </ButtonV3>
        )}
      </Actions>
    </CardContainer>
  );
};

export default ActionCard;
