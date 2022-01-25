import React from "react";
import Icon, { Props as IconProps } from "../asorted/Icon";
import FlexBox from "../layout/Flex";
import Text, { TextProps } from "../asorted/Text";
export interface Column<T> {
  /**
   * A function called to render each cell of the column.
   */
  render: (props: CellProps<T>) => React.ReactNode;
  /**
   * A valid grid template [value](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns#values).
   * This layout is applied to every cell of the column.
   * Default to "min-content" - the largest minimal content contribution of the grid item.
   */
  layout?: string;
  /**
   * A function called to render the header cell.
   * If omitted the rendered header element will be an empty div.
   */
  header?: () => React.ReactNode;
}

export interface CellProps<T> {
  /**
   * The cell element.
   */
  elt: T;
  /**
   * The row index.
   */
  rowIndex: number;
  /**
   * The column index.
   */
  columnIndex: number;
}

/**
 * A column which contains a single icon and that has a fixed width.
 */
function iconColumn<T>({
  props,
  header,
  layout,
}: {
  /**
   * An object containing the unerlying <Text /> wrapper props as well as
   * the "name" and "weight" props of the unerlying <Icon />.
   */
  props: (elt: T) => Pick<IconProps, "name" | "weight"> & TextProps;
  /**
   * An optional render function to display the column header.
   */
  header?: () => React.ReactNode;
  /**
   * The grid column layout, by default "min-content".
   */
  layout?: string;
}): Column<T> {
  return {
    layout: layout || "min-content",
    render: ({ elt }) => {
      const { name, weight, ...textProps } = props(elt);
      return (
        <Text {...textProps} style={{ display: "flex", alignItems: "center" }}>
          <Icon name={name} weight={weight} />
        </Text>
      );
    },
    header,
  };
}
export { iconColumn as icon };

/**
 * A column that contains a title and a subtitle.
 */
function textColumn<T>({
  title,
  subtitle,
  header,
  layout,
  titleProps,
  subtitleProps,
}: {
  /**
   * An optional title.
   */
  title?: (elt: T) => React.ReactNode;
  /**
   * An optional subtitle.
   */
  subtitle?: (elt: T) => React.ReactNode;
  /**
   * An optional render function to display the column header.
   */
  header?: () => React.ReactNode;
  /**
   * The grid column layout, by default "auto".
   */
  layout?: string;
  /**
   * Optional extra props passed to the title <Text /> wrapper.
   */
  titleProps?: (elt: T) => Partial<React.ComponentProps<typeof Text>>;
  /**
   * Optional extra props passed to the subtitle <Text /> wrapper.
   */
  subtitleProps?: (elt: T) => Partial<React.ComponentProps<typeof Text>>;
}): Column<T> {
  return {
    layout: layout || "auto",
    render: ({ elt }) => (
      <FlexBox flexDirection="column" justifyContent="center">
        {title && (
          <Text
            fontWeight="medium"
            variant={"body"}
            textOverflow="ellipsis"
            overflow="hidden"
            color="neutral.c100"
            {...((titleProps && titleProps(elt)) || {})}
          >
            {title(elt)}
          </Text>
        )}
        {subtitle && (
          <Text
            fontWeight="medium"
            variant={"paragraph"}
            textOverflow="ellipsis"
            overflow="hidden"
            color="neutral.c80"
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
export { textColumn as text };
