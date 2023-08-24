import React, { PureComponent } from "react";
import ReactSelect, {
  components,
  GroupTypeBase,
  MenuListComponentProps,
  OptionTypeBase,
  Props as ReactSelectProps,
  StylesConfig,
  ValueType,
} from "react-select";
import AsyncReactSelect from "react-select/async";
import { withTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import styled, { DefaultTheme, withTheme } from "styled-components";
import debounce from "lodash/debounce";
import createStyles from "./createStyles";
import createRenderers from "./createRenderers";
import { ThemeConfig } from "react-select/src/theme";

export type Props<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = false,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>,
> = {
  onChange: (a?: ValueType<OptionType, IsMulti> | null) => void;
  // custom renders
  renderOption?: (a: { data: OptionType; isDisabled: boolean }) => React.ReactNode;
  renderValue?: (a: { data: OptionType; isDisabled: boolean }) => React.ReactNode;
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
  // NB at least a different rendering for now
  stylesMap?: (a: ThemeConfig) => StylesConfig<OptionType, IsMulti, GroupType>;
  extraRenderers?: {
    [x: string]: (props: unknown) => React.ReactNode;
  };
  // Allows overriding react-select components. See: https://react-select.com/components
  disabledTooltipText?: string;
  selectDataTestId?: string;
  theme?: DefaultTheme;
} & ReactSelectProps<OptionType, IsMulti, GroupType>;

const Row = styled.div`
  max-width: 100%;
`;
class MenuList<
  OptionType extends OptionTypeBase,
  IsMulti extends boolean,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>,
> extends PureComponent<
  MenuListComponentProps<OptionType, IsMulti, GroupType> & Props<OptionType, IsMulti, GroupType>
> {
  state: {
    children: OptionType[] | null;
    currentIndex: number;
  } = {
    children: null,
    currentIndex: 0,
  };

  static getDerivedStateFromProps(
    { children }: { children: React.ReactNode },
    state: { children: React.ReactNode },
  ) {
    if (children !== state.children) {
      const currentIndex = Array.isArray(children)
        ? Math.max(
            children.findIndex(({ props: { isFocused } }) => isFocused),
            0,
          )
        : 0;
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
    const {
      options,
      maxHeight,
      getValue,
      selectProps: { noOptionsMessage, rowHeight },
      selectDataTestId,
    } = this.props;
    const { children } = this.state;
    if (!children) return null;
    const [value] = getValue();
    const initialOffset = options.indexOf(value) * rowHeight;
    const minHeight = Math.min(...[maxHeight, rowHeight * children.length]);
    if (!children.length && noOptionsMessage) {
      return <components.NoOptionsMessage {...this.props} innerProps={{}} />;
    }
    children.length &&
      children.map(key => {
        delete key.props.innerProps.onMouseMove; // NB: Removes lag on hover, see https://github.com/JedWatson/react-select/issues/3128#issuecomment-433834170
        delete key.props.innerProps.onMouseOver;
        return null;
      });
    return (
      <List
        className={"select-options-list"}
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
        data-test-id={selectDataTestId}
      >
        {({ index, style }) => (
          <Row className={"option"} style={style}>
            {children[index]}
          </Row>
        )}
      </List>
    );
  }
}
class Select<
  OptionType extends OptionTypeBase = { label: string; value: string },
  IsMulti extends boolean = false,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>,
> extends PureComponent<Props<OptionType, IsMulti, GroupType>> {
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
      this.ref && this.ref.blur();
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
  ref: ReactSelect<any, IsMulti> | undefined | null;
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
      selectDataTestId,
      ...props
    } = this.props;
    const Comp = (async ? AsyncReactSelect : ReactSelect) as typeof ReactSelect;
    let styles =
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
    // @ts-expect-error This is complicated to get it right
    styles = stylesMap ? stylesMap(styles) : styles;
    return (
      // @ts-expect-error This is complicated to get it right
      <Comp
        {...props}
        ref={c => (this.ref = c)}
        autoFocus={autoFocus}
        value={value}
        maxMenuHeight={rowHeight * 4.5}
        classNamePrefix="select"
        options={options}
        components={
          virtual
            ? {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                MenuList: MenuList as any,
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
              }
        }
        styles={styles}
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
        rowHeight={rowHeight}
        onChange={this.handleChange}
        data-test-id={selectDataTestId}
      />
    );
  }
}
export default withTranslation()(withTheme(Select)) as unknown as typeof Select;
