import React from "react";
import { InteractiveIcon } from "@ledgerhq/lumen-ui-react";
import { Close } from "@ledgerhq/lumen-ui-react/symbols";
import { Link } from "@ledgerhq/react-ui";

import ButtonV3 from "~/renderer/components/ButtonV3";
import { Actions, Body, CardContainer, Header, Description, Title } from "./components";

type Props = {
  img?: string;
  leftContent?: React.ReactNode;

  title: string;
  description: string;

  onClose?: () => void;
  closeAriaLabel?: string;
  actions: {
    primary: {
      label?: string;
      action: () => void;
      dataTestId?: string;
    };
    dismiss?: {
      label: string;
      action: () => void;
      dataTestId?: string;
    };
  };
};

const ActionCard = ({
  img,
  leftContent,
  title,
  description,
  onClose,
  closeAriaLabel = "Close content banner",
  actions,
}: Props) => {
  const dismiss = actions.dismiss;

  return (
    <CardContainer>
      {(img && <Header src={img} />) || leftContent}
      <Body>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Body>
      <Actions>
        {dismiss && dismiss.label ? (
          <Link size="small" onClick={() => dismiss.action()} data-testid={dismiss.dataTestId}>
            {dismiss.label}
          </Link>
        ) : null}

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
      {onClose ? (
        <InteractiveIcon
          type="button"
          iconType="stroked"
          icon={Close}
          size={16}
          aria-label={closeAriaLabel}
          onClick={onClose}
        />
      ) : null}
    </CardContainer>
  );
};

export default ActionCard;
