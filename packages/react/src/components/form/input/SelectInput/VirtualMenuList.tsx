import React, { memo, useMemo, useRef, useEffect } from "react";
import { components, MenuListComponentProps } from "react-select";
import { FixedSizeList, FixedSizeList as List } from "react-window";

export type RowProps = React.PropsWithChildren<{ style: React.CSSProperties }>;
export const VirtualRow = memo(({ style, children }: RowProps) => (
  <div style={style}>{children}</div>
));

export function VirtualMenuList(props: MenuListComponentProps<any, any>) {
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
            children.findIndex(({ props: { isFocused } }: any) => isFocused),
            0,
          )
        : 0,
    [children],
  );

  useEffect(() => {
    listRef.current?.scrollToItem(focusedIndex);
  }, [focusedIndex]);

  if (!children || !Array.isArray(children)) return null;

  if (childrenLength === 0 && noOptionsMessage) {
    return <components.NoOptionsMessage {...(props as any)} />;
  }

  children.length &&
    children.map((key: any) => {
      delete key.props.innerProps.onMouseMove; // NB: Removes lag on hover, see https://github.com/JedWatson/react-select/issues/3128#issuecomment-433834170
      delete key.props.innerProps.onMouseOver;
      return null;
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
        ref={listRef as any}
        width="100%"
        height={minHeight}
        overscanCount={50}
        itemCount={childrenLength}
        itemSize={rowHeight}
        initialScrollOffset={initialOffset}
      >
        {({ index, style }) => (
          <VirtualRow style={style} index={index}>
            {children[index]}
          </VirtualRow>
        )}
      </List>
    </div>
  );
}
