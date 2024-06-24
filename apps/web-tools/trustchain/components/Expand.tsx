import React, { useCallback, useState } from "react";
import styled from "styled-components";

const Details = styled.details`
  margin-top: 20px;
`;

const ControlledDetails = styled.div`
  margin-top: 20px;
`;

const Summary = styled.summary`
  cursor: pointer;
  font-weight: bold;
`;

const ControlledSummary = styled.div`
  cursor: pointer;
  font-weight: bold;
  display: list-item;
  margin-left: 14px;
`;

type Control = [boolean, React.Dispatch<React.SetStateAction<boolean>>];

function Controlled({
  title,
  children,
  control: [opened, setOpened],
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  control: Control;
}) {
  const onClick = useCallback(() => {
    setOpened(opened => !opened);
  }, [setOpened]);

  return (
    <ControlledDetails>
      <ControlledSummary
        style={{
          listStyleType: opened ? "disclosure-open" : "disclosure-closed",
        }}
        onClick={onClick}
      >
        {title}
      </ControlledSummary>
      {opened ? children : null}
    </ControlledDetails>
  );
}

export default function Expand({
  title,
  children,
  expanded,
  dynamicControl,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  expanded?: boolean;
  // when dynamic is used, we will manually handle the state and force a mount/unmount of the content. this allows to have dynamic content
  dynamicControl?: Control;
}) {
  if (dynamicControl) {
    return (
      <Controlled title={title} control={dynamicControl}>
        {children}
      </Controlled>
    );
  }
  return (
    <Details open={expanded}>
      <Summary>{title}</Summary>
      {children}
    </Details>
  );
}
