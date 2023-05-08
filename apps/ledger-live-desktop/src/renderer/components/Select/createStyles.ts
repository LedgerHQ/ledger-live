import { GroupTypeBase, OptionTypeBase, StylesConfig } from "react-select";
import { DefaultTheme } from "styled-components";
import { ff } from "~/renderer/styles/helpers";

export type CreateStylesReturnType<
  OptionType extends OptionTypeBase,
  IsMulti extends boolean = false,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>
> = StylesConfig<OptionType, IsMulti, GroupType>;

export default <
  OptionType extends OptionTypeBase,
  IsMulti extends boolean,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>
>(
  theme: DefaultTheme,
  {
    width,
    minWidth,
    small,
    isRight,
    isLeft,
    error,
    rowHeight,
  }: {
    width?: number;
    minWidth?: number;
    small?: boolean;
    isRight?: boolean;
    isLeft?: boolean;
    error?: Error | undefined | null;
    rowHeight?: number;
  },
): StylesConfig<OptionType, IsMulti, GroupType> => ({
  control: (styles, { isFocused }) => ({
    ...styles,
    width,
    minWidth,
    ...ff("Inter|SemiBold"),
    height: rowHeight || (small ? 34 : 48),
    minHeight: "unset",
    borderRadius: isRight ? "0 4px 4px 0" : isLeft ? "4px 0 0 4px" : 4,
    borderColor: error ? theme.colors.pearl : theme.colors.palette.divider,
    backgroundColor: theme.colors.palette.background.paper,
    ...(isFocused
      ? {
          borderColor: theme.colors.palette.primary.main,
          boxShadow: "rgba(0, 0, 0, 0.05) 0 2px 2px",
        }
      : {}),
  }),
  valueContainer: styles => ({
    ...styles,
    paddingLeft: 15,
    color: theme.colors.palette.text.shade100,
    minHeight: rowHeight,
  }),
  singleValue: (styles: object) => ({
    ...styles,
    overflow: "visible",
  }),
  input: styles => ({
    ...styles,
    color: theme.colors.palette.text.shade80,
  }),
  indicatorSeparator: styles => ({
    ...styles,
    background: "none",
  }),
  noOptionsMessage: styles => ({
    ...styles,
    fontSize: small ? 12 : 13,
  }),
  option: (styles, { isFocused, isSelected, isDisabled }) => ({
    ...styles,
    ...(isSelected ? ff("Inter|SemiBold") : ff("Inter|Regular")),
    fontSize: small ? 12 : 13,
    color:
      isSelected || isFocused
        ? theme.colors.palette.text.shade100
        : theme.colors.palette.text.shade80,
    height: rowHeight,
    padding: small ? "8px 15px" : "10px 15px",
    cursor: isDisabled ? "not-allowed" : "default",
    backgroundColor: isFocused ? theme.colors.palette.background.default : undefined,
    // NB hover doesn't trigger isFocused since we disabled the onMouseMove/onMouseOver
    ":hover:not(:active)": {
      backgroundColor: !isDisabled ? theme.colors.palette.background.default : undefined,
      color: !isDisabled ? theme.colors.palette.text.shade100 : undefined,
    },
    ":hover:active": {
      color: !isDisabled ? theme.colors.palette.text.shade100 : undefined,
    },
    ":active": {
      ...styles[":active"],
      backgroundColor: isDisabled ? undefined : theme.colors.palette.text.shade10,
    },
  }),
  menu: styles => ({
    ...styles,
    border: `1px solid ${theme.colors.palette.divider}`,
    boxShadow: "rgba(0, 0, 0, 0.05) 0 2px 2px",
    background: theme.colors.palette.background.paper,
    "--track-color": theme.colors.palette.text.shade30,
    borderRadius: 3,
  }),
  menuList: styles => ({
    ...styles,
    background: theme.colors.palette.background.paper,
  }),
  menuPortal: styles => ({
    ...styles,
    zIndex: 101,
  }),
  container: styles => ({
    ...styles,
    fontSize: small ? 12 : 13,
  }),
  placeholder: styles => ({
    ...styles,
    whiteSpace: "nowrap",
    hyphens: "none",
  }),
});
