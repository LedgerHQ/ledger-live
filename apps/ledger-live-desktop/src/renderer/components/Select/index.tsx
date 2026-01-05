import React, { PureComponent } from "react";
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
import { FixedSizeList as List } from "react-window";
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
  // Allows overriding react-select components. See: https://react-select.com/components
  disabledTooltipText?: string;
  theme?: DefaultTheme;
} & Omit<ReactSelectProps<OptionType, IsMulti, GroupType>, "onChange">;

const Row = styled.div`
  max-width: 100%;
`;

class MenuList<
  OptionType,
  IsMulti extends boolean,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
> extends PureComponent<
  MenuListProps<OptionType, IsMulti, GroupType> &
    Props<OptionType, IsMulti, GroupType> & {
      lastItemIndex?: number;
      keepLastScrollPosition?: boolean;
      onScrollEnd?: () => void;
    }
> {
  state: {
    children: OptionType[] | null;
    currentIndex: number;
  } = {
    children: null,
    currentIndex: 0,
  };

  static getDerivedStateFromProps(
    {
      children,
      lastItemIndex,
      keepLastScrollPosition,
    }: {
      children: React.ReactNode;
      lastItemIndex: number;
      keepLastScrollPosition: boolean;
    },
    state: { children: React.ReactNode },
  ) {
    if (children !== state.children) {
      let currentIndex: number;
      if (keepLastScrollPosition && lastItemIndex) {
        currentIndex = lastItemIndex;
      } else {
        currentIndex = Array.isArray(children)
          ? Math.max(
              children.findIndex(({ props: { isFocused } }) => isFocused),
              0,
            )
          : 0;
      }

      return {
        children,
        currentIndex,
      };
    }
    return null;
  }

  componentDidMount() {
    this.scrollList();
  }

  componentDidUpdate() {
    this.scrollList();
  }

  scrollList = () => {
    const { currentIndex } = this.state;
    if (this.list && this.list.current) {
      this.list.current.scrollToItem(currentIndex);
    }
  };

  list = React.createRef<List>();
  render() {
    const { options, maxHeight, getValue, onScrollEnd, selectProps } = this.props;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { noOptionsMessage, rowHeight = 48, inputValue = "" } = selectProps as any;
    const { children } = this.state;
    if (!children) return null;
    const [value] = getValue();
    const initialOffset = options.indexOf(value) * rowHeight;
    const minHeight = Math.min(...[maxHeight, rowHeight * children.length]);

    if (!children.length && noOptionsMessage?.({ inputValue })) {
      return <components.NoOptionsMessage {...this.props} innerProps={{}} />;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (children as any[]).forEach(key => {
      if (key?.props?.innerProps) {
        delete key.props.innerProps.onMouseMove; // NB: Removes lag on hover, see https://github.com/JedWatson/react-select/issues/3128#issuecomment-433834170
        delete key.props.innerProps.onMouseOver;
      }
    });

    const handleScroll = ({
      scrollOffset,
      scrollUpdateWasRequested,
    }: {
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => {
      if (!scrollUpdateWasRequested && onScrollEnd) {
        const totalHeight = children.length * rowHeight;
        const visibleHeight = minHeight;
        const lastScrollOffset = scrollOffset + visibleHeight;

        if (lastScrollOffset >= totalHeight - 10 && onScrollEnd) {
          onScrollEnd();
        }
      }
    };

    return (
      <List
        data-testid="select-options-list"
        ref={this.list}
        width="100%"
        style={{
          overflowX: "hidden",
        }}
        height={minHeight}
        overscanCount={8}
        itemCount={children.length}
        itemSize={rowHeight}
        initialScrollOffset={initialOffset}
        onScroll={handleScroll}
      >
        {({ index, style }) => (
          <Row style={style}>
            {/* @ts-expect-error I have no idea what's up here */}
            {children[index]}
          </Row>
        )}
      </List>
    );
  }
}
class Select<
  OptionType = { label: string; value: string },
  IsMulti extends boolean = false,
  GroupType extends GroupBase<OptionType> = GroupBase<OptionType>,
> extends PureComponent<
  Props<OptionType, IsMulti, GroupType> & {
    lastItemIndex?: number | undefined;
    keepLastScrollPosition?: boolean;
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
    {
      leading: true,
    },
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
      lastItemIndex,
      keepLastScrollPosition,
      onScrollEnd,
      ...props
    } = this.props;
    const Comp = (async ? AsyncReactSelect : ReactSelect) as typeof ReactSelect;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          MenuList: (props: any) => (
            <MenuList
              {...props}
              lastItemIndex={lastItemIndex}
              keepLastScrollPosition={keepLastScrollPosition}
              onScrollEnd={onScrollEnd}
            />
          ),
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
        ref={c => (this.ref = c)}
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
export default withTranslation()(withTheme(Select)) as unknown as typeof Select;
