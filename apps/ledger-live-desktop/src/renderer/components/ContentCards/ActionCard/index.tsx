import React, { useEffect } from "react";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { Actions, Body, CardContainer, Header, Description, Title } from "./components";
import { Link } from "@ledgerhq/react-ui";
import { useInView } from "react-intersection-observer";

type Props = {
  img?: string;
  leftContent?: React.ReactNode;

  title: string;
  description: string;

  actions: {
    primary: {
      label?: string;
      action: Function;
      dataTestId?: string;
    };
    dismiss: {
      label?: string;
      action: Function;
      dataTestId?: string;
    };
  };

  onView?: Function;
};

const ActionCard = ({ img, leftContent, title, description, actions, onView }: Props) => {
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });

  useEffect(() => {
    if (inView) onView?.();
  }, [onView, inView]);

  return (
    <CardContainer ref={ref}>
      {(img && <Header src={img} />) || leftContent}
      <Body>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Body>
      <Actions>
        <Link
          size="small"
          onClick={() => actions.dismiss.action()}
          data-test-id={actions.dismiss.dataTestId}
        >
          {actions.dismiss.label}
        </Link>

        {actions.primary.label && (
          <ButtonV3
            big
            variant="main"
            onClick={() => actions.primary.action()}
            buttonTestId={actions.primary.dataTestId}
          >
            {actions.primary.label}
          </ButtonV3>
        )}
      </Actions>
    </CardContainer>
  );
};

export default ActionCard;
