import React, { useEffect } from "react";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { Actions, Body, CardContainer, Header, Description, Title } from "./components";
import { Link } from "@ledgerhq/react-ui";
import { useInView } from "react-intersection-observer";

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
      label?: string;
      action: Function;
    };
  };

  onView?: Function;
};

const ActionCard = ({ img, title, description, actions, onView }: Props) => {
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });

  useEffect(() => {
    if (inView) onView?.();
  }, [onView, inView]);

  return (
    <CardContainer ref={ref}>
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
