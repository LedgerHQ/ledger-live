import React from "react";
import { components, Styles, OptionProps, OptionTypeBase } from "react-select";
import styled from "styled-components";
import Text from "@components/asorted/Text";

export function getStyles<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(): NonNullable<Styles<T, M>["option"]> {
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
  border-radius: 4px;
  ${(p) => (!p.disabled ? "cursor: pointer;" : "")}
  ${(props) => {
    const { theme, selected, focus, disabled } = props;
    if (selected) {
      return `
        color: ${theme.colors.palette.primary.c90};
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
        background: ${theme.colors.palette.primary.c10};
      }
      &:active {
        color: ${theme.colors.palette.neutral.c100};
        background: ${theme.colors.palette.primary.c30};
      }
      ${
        focus
          ? `&:not(:active) {
          color: ${theme.colors.palette.neutral.c100};
          background: ${theme.colors.palette.primary.c10};
        }`
          : ""
      }
    `;
  }};
`;

export type ExtraProps<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
> = {
  /* A render function to customize the contents. */
  render?: (props: React.PropsWithChildren<OptionProps<T, M>>) => React.ReactNode;
};
export type Props<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
> = OptionProps<T, M> & ExtraProps<T, M>;
export function Option<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(props: Props<T, M>): JSX.Element {
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
