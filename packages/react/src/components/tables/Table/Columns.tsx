import React from "react";
import Icon, { Props as IconProps } from "../../asorted/Icon";
import FlexBox from "../../layout/Flex";
import Text, { BaseTextProps } from "../../asorted/Text";

export interface CellProps<T> {
  elt: T;
  rowIndex: number;
  columnIndex: number;
}

type HeaderFn = () => React.ReactNode;

export interface Column<T> {
  layout?: string;
  render: (props: CellProps<T>) => React.ReactNode;
  header?: HeaderFn;
}

/**
 * A column which contains a single icon and that has a fixed width.
 */
export function IconColumn<T>({
  props,
  header,
  layout,
}: {
  // An object containing the unerlying <Text /> wrapper props as well as
  // the "name" and "weight" props of the unerlying <Icon />.
  props: (elt: T) => Pick<IconProps, "name" | "weight"> & BaseTextProps;
  // An optional render function to display the column header.
  header?: HeaderFn;
  // The grid column layout, by default "min-content".
  layout?: string;
}): Column<T> {
  return {
    layout: layout || "min-content",
    render: ({ elt }) => {
      const { name, weight, ...textProps } = props(elt);
      return (
        <Text {...textProps} style={{ display: "flex" }}>
          <Icon name={name} weight={weight} />
        </Text>
      );
    },
    header,
  };
}

/**
 * A column that contains a title and a subtitle.
 */
export function TextColumn<T>({
  // An optional title.
  title,
  // An optional subtitle.
  subtitle,
  // An optional render function to display the column header.
  header,
  // The grid column layout, by default "auto".
  layout,
  // Optional extra props passed to the title <Text /> wrapper.
  titleProps,
  // Optional extra props passed to the subtitle <Text /> wrapper.
  subtitleProps,
}: {
  title?: (elt: T) => React.ReactNode;
  subtitle?: (elt: T) => React.ReactNode;
  header?: HeaderFn;
  layout?: string;
  titleProps?: (elt: T) => Partial<React.ComponentProps<typeof Text>>;
  subtitleProps?: (elt: T) => Partial<React.ComponentProps<typeof Text>>;
}): Column<T> {
  return {
    layout: layout || "auto",
    render: ({ elt }) => (
      <FlexBox flexDirection="column">
        {title && (
          <Text
            ff="Inter|Medium"
            fontSize={4}
            textOverflow="ellipsis"
            overflow="hidden"
            color="palette.neutral.c100"
            {...((titleProps && titleProps(elt)) || {})}
          >
            {title(elt)}
          </Text>
        )}
        {subtitle && (
          <Text
            ff="Inter|Medium"
            fontSize={3}
            textOverflow="ellipsis"
            overflow="hidden"
            color="palette.neutral.c80"
            {...((subtitleProps && subtitleProps(elt)) || {})}
          >
            {subtitle(elt)}
          </Text>
        )}
      </FlexBox>
    ),
    header,
  };
}
