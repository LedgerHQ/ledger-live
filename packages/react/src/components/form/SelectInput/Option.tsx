import React from "react";
import { components, GroupBase, StylesConfig, OptionProps } from "react-select";
import styled from "styled-components";
import Text from "../../asorted/Text";

export function getStyles<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(): NonNullable<StylesConfig<O, M, G>["option"]> {
  return (provided) => ({
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
  });
}

const Wrapper = styled(Text).attrs({ as: "div" })<{
  disabled: boolean;
  selected: boolean;
  focus: boolean;
}>`
  height: 48px;
  display: flex;
  padding: 0 ${(p) => p.theme.space[5]}px;
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  ${(p) => (!p.disabled ? "cursor: pointer;" : "")}
  ${(props) => {
    const { theme, selected, focus, disabled } = props;
    if (selected) {
      return `
        color: ${theme.colors.primary.c90};
        background: ${theme.colors.primary.c20};
      `;
    }
    if (disabled) {
      return `
        color: ${theme.colors.neutral.c50};
        ${
          focus
            ? `&:not(:active) {
            background: ${theme.colors.neutral.c20};
          }`
            : ""
        }
      `;
    }
    return `
      color: ${theme.colors.neutral.c80};
      &:hover {
        color: ${theme.colors.neutral.c100};
        background: ${theme.colors.primary.c10};
      }
      &:active {
        color: ${theme.colors.neutral.c100};
        background: ${theme.colors.primary.c30};
      }
      ${
        focus
          ? `&:not(:active) {
          color: ${theme.colors.neutral.c100};
          background: ${theme.colors.primary.c10};
        }`
          : ""
      }
    `;
  }};
`;

export type ExtraProps<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
> = {
  /* A render function to customize the contents. */
  render?: (props: React.PropsWithChildren<OptionProps<O, M, G>>) => React.ReactNode;
};
export type Props<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
> = OptionProps<O, M, G> & ExtraProps<O, M, G>;
export function Option<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(props: Props<O, M, G>): JSX.Element {
  const { render, children, ...innerProps } = props;

  return (
    <Wrapper
      disabled={props.isDisabled}
      selected={props.isSelected}
      focus={props.isFocused}
      fontWeight="semiBold"
      variant={"paragraph"}
    >
      <components.Option {...innerProps}>{render ? render(props) : children}</components.Option>
    </Wrapper>
  );
}
