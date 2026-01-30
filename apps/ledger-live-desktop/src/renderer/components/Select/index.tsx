import React, { useRef, useEffect, useMemo, useCallback, memo } from "react";
import ReactSelect, {
  components,
  GroupBase,
  MenuListProps,
  Props as ReactSelectProps,
  StylesConfig,
  OnChangeValue,
} from "react-select";
import AsyncReactSelect from "react-select/async";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import styled, { DefaultTheme, useTheme } from "styled-components";
import debounce from "lodash/debounce";
import createStyles from "./createStyles";
import createRenderers from "./createRenderers";

export type Props<
  OptionType = { label: string; value: string },
  IsMulti extends boolean = false,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
> = {
  onChange: (a?: OnChangeValue<OptionType, IsMulti> | null) => void;
  // custom renders
  renderOption?: (a: { data: OptionType; isDisabled: boolean }) => React.ReactNode;
  renderValue?: (a: { data: OptionType; isDisabled: boolean }) => React.ReactNode;
  /** @deprecated Use renderValue instead - accepts various legacy formats */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderSelected?: (a: any) => React.ReactNode;
  /** @deprecated Not used in react-select v5 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemToString?: (item: any) => string;
  // optional
  async?: boolean;
  isRight?: boolean;
  isLeft?: boolean;
  small?: boolean;
  width?: number;
  minWidth?: number;
  virtual?: boolean;
  rowHeight?: number;
  disableOptionPadding?: boolean;
  error?: Error | undefined | null;
  fakeFocusRight?: boolean;
  // NB at least a different rendering for now
  stylesMap?: (
    a: StylesConfig<OptionType, IsMulti, GroupType>,
  ) => StylesConfig<OptionType, IsMulti, GroupType>;
  extraRenderers?: {
    [x: string]: (props: unknown) => React.ReactNode;
  };
  disabledTooltipText?: string;
  theme?: DefaultTheme;
} & Omit<ReactSelectProps<OptionType, IsMulti, GroupType>, "onChange">;

const Row = styled.div`
  max-width: 100%;
`;

type VirtualMenuListProps<
  OptionType,
  IsMulti extends boolean,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
> = MenuListProps<OptionType, IsMulti, GroupType> & {
  onScrollEnd?: () => void;
};

function VirtualMenuList<
  OptionType,
  IsMulti extends boolean,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
>(props: VirtualMenuListProps<OptionType, IsMulti, GroupType>) {
  const { options, maxHeight, getValue, onScrollEnd, selectProps, children } = props;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { noOptionsMessage, rowHeight = 48, inputValue = "" } = selectProps as any;

  const parentRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  type ChildWithInnerProps = React.ReactElement<{ innerProps?: Record<string, unknown> }>;

  const childrenArray = useMemo(
    () =>
      React.Children.toArray(children).map(child => {
        if (!React.isValidElement(child)) return child;
        const props = (child as ChildWithInnerProps).props;
        if (!props.innerProps) return child;
        const { onMouseMove, onMouseOver, ...restInnerProps } = props.innerProps;
        return React.cloneElement(child as ChildWithInnerProps, {
          innerProps: restInnerProps,
        });
      }),
    [children],
  );

  const [value] = getValue();
  const initialOffset = options.indexOf(value) * rowHeight;
  const listHeight = Math.min(maxHeight, rowHeight * childrenArray.length);

  const virtualizer = useVirtualizer({
    count: childrenArray.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  useEffect(() => {
    if (!hasScrolledRef.current && initialOffset > 0 && parentRef.current) {
      parentRef.current.scrollTop = initialOffset;
      hasScrolledRef.current = true;
    }
  }, [initialOffset]);

  // Handle scroll end for infinite loading
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !onScrollEnd) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      onScrollEnd();
    }
  }, [onScrollEnd]);

  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement || !onScrollEnd) return;

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [handleScroll, onScrollEnd]);

  if (!childrenArray.length) {
    return noOptionsMessage?.({ inputValue }) ? (
      <components.NoOptionsMessage {...props} innerProps={{}} />
    ) : null;
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        width: "100%",
        height: listHeight,
        overflow: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem: VirtualItem) => (
          <Row
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {childrenArray[virtualItem.index]}
          </Row>
        ))}
      </div>
    </div>
  );
}

function createVirtualMenuList(onScrollEnd?: () => void) {
  return function StableMenuList<
    OptionType,
    IsMulti extends boolean,
    GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
  >(menuListProps: MenuListProps<OptionType, IsMulti, GroupType>) {
    return <VirtualMenuList {...menuListProps} onScrollEnd={onScrollEnd} />;
  };
}

const Select = <
  OptionType = { label: string; value: string },
  IsMulti extends boolean = false,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
>(
  props: Props<OptionType, IsMulti, GroupType> & { onScrollEnd?: () => void },
) => {
  const {
    async,
    value,
    isClearable,
    isSearchable,
    isDisabled,
    isLoading,
    isRight,
    isLeft,
    placeholder,
    options,
    renderOption,
    renderValue,
    width,
    minWidth,
    small,
    error,
    stylesMap,
    virtual = true,
    rowHeight = small ? 34 : 48,
    autoFocus,
    extraRenderers,
    onScrollEnd,
    onChange,
    ...restProps
  } = props;

  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = useRef<any>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const resizeHandler = useMemo(
    () =>
      debounce(
        () => {
          if (selectRef.current) selectRef.current.blur();
        },
        200,
        { leading: true },
      ),
    [],
  );

  useEffect(() => {
    if (selectRef.current && autoFocus) {
      timeoutRef.current = requestAnimationFrame(() => selectRef.current?.focus());
    }
    window.addEventListener("resize", resizeHandler);

    return () => {
      if (timeoutRef.current) {
        cancelAnimationFrame(timeoutRef.current);
      }
      window.removeEventListener("resize", resizeHandler);
    };
  }, [autoFocus, resizeHandler]);

  const handleChange = useCallback(
    (value: OnChangeValue<OptionType, IsMulti>, { action }: { action: string }) => {
      if (action === "select-option") {
        onChange(value);
      }
      if (action === "pop-value") {
        onChange(null);
      }
    },
    [onChange],
  ) as ReactSelectProps<OptionType, IsMulti, GroupType>["onChange"];

  const Comp = async ? AsyncReactSelect : ReactSelect;

  const baseStyles = useMemo(
    () =>
      theme &&
      createStyles(theme, {
        width,
        minWidth,
        small,
        isRight,
        isLeft,
        error,
        rowHeight,
      }),
    [theme, width, minWidth, small, isRight, isLeft, error, rowHeight],
  );

  const baseStylesWithPlaceholder = useMemo(
    () => ({
      ...baseStyles,
      placeholder: (base: React.CSSProperties) => ({
        ...base,
        color: theme?.colors.neutral.c60,
      }),
    }),
    [baseStyles, theme],
  );

  const styles = useMemo(
    () =>
      stylesMap
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stylesMap(baseStylesWithPlaceholder as any)
        : baseStylesWithPlaceholder,
    [stylesMap, baseStylesWithPlaceholder],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customComponents: any = useMemo(
    () =>
      virtual
        ? {
            MenuList: createVirtualMenuList(onScrollEnd),
            ...createRenderers({
              renderOption,
              renderValue,
              selectProps: props,
            }),
            ...(extraRenderers || {}),
          }
        : {
            ...createRenderers({
              renderOption,
              renderValue,
              selectProps: props,
            }),
            ...(extraRenderers || {}),
          },
    [virtual, onScrollEnd, renderOption, renderValue, props, extraRenderers],
  );

  return (
    <Comp
      {...restProps}
      ref={selectRef}
      autoFocus={autoFocus}
      value={value}
      maxMenuHeight={rowHeight * 4.5}
      classNamePrefix="select"
      options={options}
      components={customComponents}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      styles={styles as any}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable={isClearable}
      isSearchable={isSearchable}
      menuPlacement="auto"
      blurInputOnSelect={false}
      backspaceRemovesValue
      captureMenuScroll={false}
      menuShouldBlockScroll
      menuPortalTarget={document.body}
      // @ts-expect-error rowHeight is a custom prop passed through selectProps
      rowHeight={rowHeight}
      onChange={handleChange}
    />
  );
};

export default memo(Select) as typeof Select;
