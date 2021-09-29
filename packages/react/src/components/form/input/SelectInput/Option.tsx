import React from "react";
import { components, Styles, OptionProps } from "react-select";
import styled from "styled-components";
import { Base as Text } from "@components/asorted/Text";

export const getStyles: Styles<any, any>["option"] = function getStyles(provided) {
  return {
    ...provided,
    display: "flex",
    alignItems: "center",
    padding: 0,
    cursor: "inherit",
    background: "inherit",
    color: "inherit",
    boxShadow: "none",
    border: "none",
    ":active": undefined,
  };
};

const Wrapper = styled(Text).attrs({ as: "div" })<{
  disabled: boolean;
  selected: boolean;
  focus: boolean;
}>`
  height: 48px;
  display: flex;
  padding: 0 ${(p) => p.theme.space[5]}px;
  border-radius: 4px;
  ${(p) => (!p.disabled ? "cursor: pointer;" : "")}
  ${(props) => {
    const { theme, selected, focus, disabled } = props;
    if (selected) {
      return `
        color: ${theme.colors.palette.neutral.c160};
        background: ${theme.colors.palette.primary.c20};
      `;
    }
    if (disabled) {
      return `
        color: ${theme.colors.palette.neutral.c50};
        ${
          focus
            ? `&:not(:active) {
            background: ${theme.colors.palette.neutral.c20};
          }`
            : ""
        }
      `;
    }
    return `
      color: ${theme.colors.palette.neutral.c80};
      &:hover {
        color: ${theme.colors.palette.neutral.c100};
        background: ${theme.colors.palette.primary.c05};
      }
      &:active {
        color: ${theme.colors.palette.neutral.c100};
        background: ${theme.colors.palette.primary.c40};
      }
      ${
        focus
          ? `&:not(:active) {
          color: ${theme.colors.palette.neutral.c100};
          background: ${theme.colors.palette.primary.c05};
        }`
          : ""
      }
    `;
  }};
`;

type ExtraProps = {
  /* A render function to customize the contents. */
  render?: (props: React.PropsWithChildren<OptionProps<any, any>>) => React.ReactNode;
};
export function Option(props: OptionProps<any, any> & ExtraProps) {
  const { render, children, ...innerProps } = props;

  return (
    <Wrapper
      disabled={props.isDisabled}
      selected={props.isSelected}
      focus={props.isFocused}
      ff="Inter|SemiBold"
      fontSize={3}
    >
      <components.Option {...innerProps}>{render ? render(props) : children}</components.Option>
    </Wrapper>
  );
}
