import React from "react";
import { components, GroupBase, StylesConfig, MenuListProps } from "react-select";
import { DefaultTheme } from "styled-components";

export function getStyles<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(theme: DefaultTheme): NonNullable<StylesConfig<O, M, G>["menuList"]> {
  const isLight = theme.colors.type === "light";
  return (provided) => ({
    ...provided,
    display: "flex",
    flexDirection: "column",
    gap: theme.space[2],
    padding: theme.space[3],
    border: `1px solid ${theme.colors.neutral[isLight ? "c20" : "c30"]}`,
    borderRadius: "8px",
    boxShadow: `0px 6px 12px rgba(0, 0, 0, ${isLight ? 0.04 : 0.08})`,
    background: theme.colors.neutral[isLight ? "c00" : "c20"],
    color: theme.colors.neutral.c80,
  });
}

export function MenuList<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(props: MenuListProps<O, M, G>): JSX.Element {
  return <components.MenuList {...props}>{props.children}</components.MenuList>;
}
