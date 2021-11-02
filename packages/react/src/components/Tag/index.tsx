import React from "react";
import styled from "styled-components";
import { border, BorderProps, space, SpaceProps, color, ColorProps } from "styled-system";
import Text from "../asorted/Text";

export type Props = React.PropsWithChildren<
  {
    /**
     * Changes the appearance based on the active state.
     */
    active?: boolean;
    /**
     * Tag style.
     */
    type?: "plain" | "opacity" | "outlined";
  } & BorderProps &
    ColorProps
>;

function getColor({ type, active }: Props) {
  switch (type) {
    case "opacity":
    case "outlined":
      return "palette.primary.c90";
    default:
      return active ? "palette.neutral.c00" : "palette.primary.c90";
  }
}
function getBgColor({ type, active }: Props) {
  switch (type) {
    case "opacity":
      return active ? "palette.primary.c20" : undefined;
    case "outlined":
      return;
    default:
      return active ? "palette.primary.c90" : undefined;
  }
}

function getBorderColor({ type, active }: Props) {
  if (type === "outlined" && active) {
    return "palette.primary.c90";
  }
}

const TagContainer = styled.div.attrs((props: Props) => ({
  backgroundColor: props.bg || props.backgroundColor || getBgColor(props),
  color: props.color || getColor(props),
  borderColor: getBorderColor(props),
  p: "7px", // TODO: use spacing from the theme when it gets updated
}))<Props & BorderProps & SpaceProps & ColorProps>`
  display: inline-flex;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  ${border}
  ${space}
  ${color}
`;

export default function Tag({ children, ...props }: Props): JSX.Element {
  const textColor = getColor(props);
  return (
    <TagContainer {...props}>
      <Text variant="tiny" color={textColor}>
        {children}
      </Text>
    </TagContainer>
  );
}
