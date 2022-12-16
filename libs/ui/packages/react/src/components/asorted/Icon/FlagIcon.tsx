import * as flags from "@ledgerhq/icons-ui/react/Flags/index";
import React from "react";
import styled from "styled-components";
import FlexBox from "../../layout/Flex";

export const sizes = {
  XXS: 16,
  S: 32,
  L: 48,
};

export type FlagsSizes = keyof typeof sizes;

export type Props = {
  name: string;
  size?: FlagsSizes;
};

export const iconNames = Array.from(
  Object.keys(flags).reduce((set, rawKey) => {
    const key = rawKey
      .replace(/(.+)(Regular|Light|UltraLight|Thin|Medium)+$/g, "$1")
      .replace(/(.+)(Ultra)+$/g, "$1");
    if (!set.has(key)) set.add(key);
    return set;
  }, new Set<string>()),
);

const FlagContainer = styled(FlexBox).attrs({
  borderRadius: "50%",
  position: "relative",
})`
  &:after {
    content: "";
    display: block;
    box-shadow: inset 0 0 10px black;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 100%;
    opacity: 10%;
    ${(p) => `box-shadow: inset 0px 0px 0px 1px ${p.theme.colors.neutral.c100};`}
  }
`;

const FlagIcon = ({ name, size = "S" }: Props): JSX.Element | null => {
  const maybeIconName = `${name}`;

  if (maybeIconName in flags) {
    // @ts-expect-error FIXME I don't know how to make you happy ts
    const Component = flags[maybeIconName];
    return (
      <FlagContainer width={sizes[size]} height={sizes[size]} overflow={"hidden"}>
        <Component size={sizes[size]} />
      </FlagContainer>
    );
  }
  return null;
};

export default FlagIcon;
