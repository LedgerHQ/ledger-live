import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import IconExternal from "~/renderer/icons/ExternalLink";

export type ContextType = {
  showContextMenu: (event: MouseEvent, items: ContextMenuItemType[]) => void;
};

export const ContextMenuContext = React.createContext<ContextType>({
  showContextMenu: () => undefined,
});

export function withContextMenuContext<P>(
  ComponentToDecorate: React.ComponentType<P & { context: ContextType }>,
): React.ComponentType<P> {
  const WrappedContextMenu = (props: P) => (
    <ContextMenuContext.Consumer>
      {context => <ComponentToDecorate {...props} context={context} />}
    </ContextMenuContext.Consumer>
  );
  return WrappedContextMenu;
}

export type ContextMenuItemType = {
  label: string;
  Icon?: React.ComponentType<{ size: number }> | React.ComponentType<{}>;
  callback?: (a: React.MouseEvent<HTMLDivElement>) => void;
  dontTranslateLabel?: boolean;
  id?: string;
  type?: string;
};
type Props = {
  children: React.ReactNode;
};
type State = {
  visible: boolean;
  items: ContextMenuItemType[];
  x: number;
  y: number;
};
const Separator = styled.div`
  background-color: ${p => p.theme.colors.palette.divider};
  height: 1px;
  margin-top: 8px;
  margin-bottom: 8px;
`;
const ContextMenuContainer = styled(Box)<{
  x: number;
  y: number;
}>`
  position: absolute;
  top: ${p => p.y}px;
  left: ${p => p.x}px;
  width: auto;
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 #00000007;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  background-color: ${p => p.theme.colors.palette.background.paper};
  padding: 10px;
`;

type ContextMenuItemContainerProps = {
  isActive?: boolean;
  disabled?: boolean;
};

const ContextMenuItemContainer = styled(Box).attrs<ContextMenuItemContainerProps>(p => ({
  ff: "Inter",
  color: p.disabled
    ? "palette.text.shade50"
    : p.isActive
    ? "palette.text.shade100"
    : "palette.text.shade60",
  bg: p.isActive && !p.disabled ? "palette.background.default" : "",
}))<ContextMenuItemContainerProps>`
  padding: 8px 16px;
  text-align: center;
  flex-direction: row;
  align-items: flex-start;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  justify-content: space-between;

  & > * {
    pointer-events: none;
  }

  & > * {
    pointer-events: none;
  }
  &:hover {
    cursor: pointer;
    background: ${p => p.theme.colors.palette.background.default};
  }
`;
class ContextMenuWrapper extends PureComponent<Props, State> {
  state = {
    visible: false,
    items: [],
    x: 0,
    y: 0,
  };

  containerRef: HTMLDivElement | null = null;
  componentWillUnmount() {
    window.removeEventListener("click", this.hideContextMenu, true);
  }

  showContextMenu = (event: MouseEvent, items: ContextMenuItemType[]) => {
    const { clientX: x, clientY: y } = event;
    const { innerHeight: wy, innerWidth: wx } = window;
    const xOffset = wx - x < 170 ? -170 : 0; // FIXME do this dynamically?
    const yOffset = wy < y + items.length * 30 ? -items.length * 30 : 0;
    this.setState({
      visible: true,
      items,
      x: x + xOffset,
      y: y + yOffset,
    });
    window.addEventListener("click", this.hideContextMenu, true);
  };

  hideContextMenu = (evt?: MouseEvent) => {
    // NB Allow opening the context menu on a different target if already open.
    // @ts-expect-error FIXME rework this in a non deprecated way
    if (evt?.srcElement?.parentElement === this.containerRef) {
      return;
    }
    this.setState({
      visible: false,
      items: [],
    });
    window.removeEventListener("click", this.hideContextMenu, true);
  };

  setContainerRef = (ref: HTMLDivElement) => {
    this.containerRef = ref;
  };

  renderItem = (item: ContextMenuItemType) => {
    const { dontTranslateLabel, callback, label, Icon, id } = item;
    if (item.type === "separator") {
      return <Separator key={id} />;
    }
    return (
      <ContextMenuItemContainer
        key={id}
        id={id}
        onClick={e => {
          if (callback) callback(e);
          this.hideContextMenu();
        }}
      >
        <Box horizontal>
          {Icon && (
            <Box pr={2} color="palette.text.shade60">
              <Icon size={16} />
            </Box>
          )}
          {(dontTranslateLabel && label) || <Trans i18nKey={label} />}
        </Box>
        {item.type === "external" ? (
          <Box ml={4}>
            <IconExternal size={16} />
          </Box>
        ) : null}
      </ContextMenuItemContainer>
    );
  };

  render() {
    const { x, y, items } = this.state;
    const { children } = this.props;
    return (
      <ContextMenuContext.Provider
        value={{
          showContextMenu: this.showContextMenu,
        }}
      >
        {children}
        {this.state.visible && (
          <ContextMenuContainer ref={this.setContainerRef} x={x} y={y}>
            {items.map(this.renderItem)}
          </ContextMenuContainer>
        )}
      </ContextMenuContext.Provider>
    );
  }
}
export default ContextMenuWrapper;
