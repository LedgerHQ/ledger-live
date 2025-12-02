import React, { memo, useMemo, useRef, useEffect } from "react";
import { components, GroupBase, MenuListProps } from "react-select";
import { FixedSizeList, FixedSizeList as List } from "react-window";
import { Props as SelectProps } from "./index";

export type RowProps = React.PropsWithChildren<{ style: React.CSSProperties }>;
export const VirtualRow = memo(({ style, children }: RowProps) => (
  <div style={style}>{children}</div>
));

export function VirtualMenuList<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(props: MenuListProps<O, M, G>): React.ReactElement {
  const { children, options, maxHeight, getValue, getStyles, selectProps } = props;
  const { noOptionsMessage, rowHeight = 0 } = selectProps as SelectProps<O, M, G>;

  const listRef = useRef<FixedSizeList | null>(null);
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
              (child: React.ReactNode) =>
                React.isValidElement(child) && (child.props as { isFocused?: boolean }).isFocused,
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
      const nodeProps = node.props as {
        innerProps?: { onMouseMove?: unknown; onMouseOver?: unknown };
      };
      if (nodeProps.innerProps) {
        delete nodeProps.innerProps.onMouseMove; // NB: Removes lag on hover, see https://github.com/JedWatson/react-select/issues/3128#issuecomment-433834170
        delete nodeProps.innerProps.onMouseOver;
      }
    });

  return (
    <div
      style={{ ...(menuStyle as React.CSSProperties), maxHeight: "auto" }}
      onWheelCapture={e =>
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
