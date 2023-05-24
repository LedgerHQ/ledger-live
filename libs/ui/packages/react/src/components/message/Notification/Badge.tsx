import React from "react";
import styled from "styled-components";
import { color, position, shadow, border, background, layout } from "styled-system";

const ActiveCircle = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 10px;
  width: 10px;
  border-radius: 9999px;
  box-sizing: content-box;
  background-color: ${(p) => p.theme.colors.error.c50};

  border: 2px solid
    var(
      --notification-badge-border,
      ${(p) => {
        /* The CSS variable is dynamically set by the Notification component */
        return p.theme.colors.background.main;
      }}
    );
`;

const Wrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  ${color}
  ${position}
  ${shadow}
  ${border}
  ${background}
  ${layout}
`;

export type Props = {
  /* If true a notification bubble will be displayed in the top right corner of the badge. */
  active?: boolean;
  /* JSX filling up the space inside the badge, usually an <Icon />. */
  icon: JSX.Element;
} & React.ComponentProps<typeof Wrapper>;
export default function Badge({ active, icon, ...props }: Props): JSX.Element {
  return (
    <Wrapper {...props}>
      {icon}
      {active && <ActiveCircle />}
    </Wrapper>
  );
}
