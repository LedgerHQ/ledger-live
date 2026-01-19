import React, { PureComponent, useRef, useEffect, useMemo, useCallback } from "react";
import ReactSelect, {
  components,
  GroupBase,
  MenuListProps,
  Props as ReactSelectProps,
  StylesConfig,
  OnChangeValue,
} from "react-select";
import AsyncReactSelect from "react-select/async";
import { withTranslation } from "react-i18next";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import styled, { DefaultTheme, withTheme } from "styled-components";
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

  const childrenArray = useMemo(
    () =>
      React.Children.toArray(children).map(child => {
        if (!React.isValidElement(child) || !child.props.innerProps) return child;

        const { onMouseMove, onMouseOver, ...restInnerProps } = child.props.innerProps;
        return React.cloneElement(
          child as React.ReactElement<{ innerProps?: Record<string, unknown> }>,
          { innerProps: restInnerProps },
        );
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

class Select<
  OptionType = { label: string; value: string },
  IsMulti extends boolean = false,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
> extends PureComponent<
  Props<OptionType, IsMulti, GroupType> & {
    onScrollEnd?: () => void;
  }
> {
  componentDidMount() {
    if (this.ref && this.props.autoFocus) {
      this.timeout = requestAnimationFrame(() => this.ref?.focus());
    }
    window.addEventListener("resize", this.resizeHandler);
  }

  componentWillUnmount() {
    if (this.timeout) {
      cancelAnimationFrame(this.timeout);
    }
    window.removeEventListener("resize", this.resizeHandler);
  }

  resizeHandler = debounce(
    () => {
      if (this.ref) this.ref.blur();
    },
    200,
    { leading: true },
  );

  handleChange: ReactSelectProps<OptionType, IsMulti, GroupType>["onChange"] = (
    value,
    { action },
  ) => {
    const { onChange } = this.props;
    if (action === "select-option") {
      onChange(value);
    }
    if (action === "pop-value") {
      onChange(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any;
  timeout: number | undefined;

  render() {
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
      theme,
      error,
      stylesMap,
      virtual = true,
      rowHeight = small ? 34 : 48,
      autoFocus,
      extraRenderers,
      onScrollEnd,
      ...props
    } = this.props;

    const Comp = async ? AsyncReactSelect : ReactSelect;

    const baseStyles =
      theme &&
      createStyles(theme, {
        width,
        minWidth,
        small,
        isRight,
        isLeft,
        error,
        rowHeight,
      });

    const baseStylesWithPlaceholder = {
      ...baseStyles,
      placeholder: (base: React.CSSProperties) => ({
        ...base,
        color: theme?.colors.neutral.c60,
      }),
    };

    const styles = stylesMap
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stylesMap(baseStylesWithPlaceholder as any)
      : baseStylesWithPlaceholder;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customComponents: any = virtual
      ? {
          MenuList: createVirtualMenuList(this.props.onScrollEnd),
          ...createRenderers({
            renderOption,
            renderValue,
            selectProps: this.props,
          }),
          ...(extraRenderers || {}),
        }
      : {
          ...createRenderers({
            renderOption,
            renderValue,
            selectProps: this.props,
          }),
          ...(extraRenderers || {}),
        };

    return (
      <Comp
        {...props}
        ref={(c: unknown) => (this.ref = c)}
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
        onChange={this.handleChange}
      />
    );
  }
}

// Type assertion required due to complex HOC composition (withTranslation + withTheme)
// The wrapped component maintains the same API surface as the original Select class
// eslint-disable-next-line
export default withTranslation()(withTheme(Select)) as unknown as typeof Select;
