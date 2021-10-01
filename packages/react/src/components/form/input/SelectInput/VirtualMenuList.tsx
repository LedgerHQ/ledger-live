import React, { memo, useMemo, useRef, useEffect } from "react";
import { components, MenuListComponentProps, OptionTypeBase } from "react-select";
import { FixedSizeList, FixedSizeList as List } from "react-window";

export type RowProps = React.PropsWithChildren<{ style: React.CSSProperties }>;
export const VirtualRow = memo(({ style, children }: RowProps) => (
  <div style={style}>{children}</div>
));

export function VirtualMenuList<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(props: MenuListComponentProps<T, M>): React.ReactElement {
  const {
    children,
    options,
    maxHeight,
    getValue,
    getStyles,
    selectProps: { noOptionsMessage, rowHeight },
  } = props;

  const listRef = useRef<FixedSizeList>();
  const [value] = getValue();
  const initialOffset = options.indexOf(value) * rowHeight;
  const childrenLength = Array.isArray(children) ? children.length : 0;
  const minHeight = Math.min(maxHeight, rowHeight * childrenLength);

  const menuStyle = getStyles("menuList", props);

  const focusedIndex = useMemo(
    () =>
      Array.isArray(children)
        ? Math.max(
            children.findIndex(
              (child: React.ReactNode) => React.isValidElement(child) && child.props.isFocused,
            ),
            0,
          )
        : 0,
    [children],
  );

  useEffect(() => {
    listRef.current?.scrollToItem(focusedIndex);
  }, [focusedIndex]);

  if (!children || !Array.isArray(children)) return <></>;

  if (childrenLength === 0 && noOptionsMessage) {
    return <components.NoOptionsMessage {...{ ...props, innerProps: {} }} />;
  }

  children.length &&
    children.forEach((node: React.ReactNode) => {
      if (!node || !React.isValidElement(node)) return;
      delete node.props.innerProps.onMouseMove; // NB: Removes lag on hover, see https://github.com/JedWatson/react-select/issues/3128#issuecomment-433834170
      delete node.props.innerProps.onMouseOver;
    });

  return (
    <div
      style={{ ...menuStyle, maxHeight: "auto" }}
      onWheelCapture={(e) =>
        /*
          This event causes issues with react-window.
          react-select logic is based on whether the bottom/top of the list has been reached
          but with virtual lists it just does not work and prevents scrolling…
        */
        e.stopPropagation()
      }
    >
      <List
        ref={listRef as React.LegacyRef<FixedSizeList>}
        width="100%"
        height={minHeight}
        overscanCount={50}
        itemCount={childrenLength}
        itemSize={rowHeight}
        initialScrollOffset={initialOffset}
      >
        {({ index, style }) => <VirtualRow style={style}>{children[index]}</VirtualRow>}
      </List>
    </div>
  );
}
