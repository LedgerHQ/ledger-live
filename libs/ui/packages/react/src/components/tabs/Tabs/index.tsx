import React, { useState, useEffect, createRef, forwardRef } from "react";
import styled from "styled-components";
import Flex from "../../layout/Flex";
import Tag from "../../Tag";
import Text from "../../asorted/Text";

export interface TabContent {
  index: number;
  title: string;
  disabled?: boolean;
  badge?: string | number;
  Component: React.ReactNode;
}

export type Props = React.PropsWithChildren<{
  /**
   * An optional callback that will be called when the active tab changes.
   */
  onTabChange?: (index: number) => void;
  /**
   * The tab index to mark as active when rendering for the first time.
   * If omitted, then initially no tabs will be selected.
   */
  activeIndex?: number;
  tabs: TabContent[];
}>;

const Container = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
})``;

const TabHeader = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
`;

const TabHeaderContent = styled(Flex).attrs({
  flex: 1,
  alignItems: "center",
})`
  width: 100%;
`;

const TabHeaderBox = styled.div<{ disabled: boolean }>`
  display: flex;
  flex-grow: inherit;
  justify-content: center;
  text-align: center;
  cursor: ${p => (p.disabled ? "default" : "pointer")};
  padding: 8px 12px;
`;

const HeaderTitle = styled(Text).attrs({
  fontWeight: "600",
})<{ selected: boolean }>`
  margin-inline: 12px;
  color: ${p => (p.selected ? p.theme.colors.neutral.c100 : p.theme.colors.neutral.c80)};
`;

const HeaderBottomBarFixed = styled(Flex).attrs({
  flex: 1,
})`
  width: 100%;
  position: relative;
  top: 3px;
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
`;

const HeaderBottomBarMoving = styled.div<HeaderBottomBarProps>`
  position: relative;
  left: ${p => p.left}px;
  width: ${p => p.width}px;
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  border-bottom: solid 3px;
  border-bottom-color: ${p => p.theme.colors.primary.c70};
`;

const Badge = styled(Tag).attrs(p => ({
  borderRadius: p.theme.radii[3],
  backgroundColor: p.theme.colors.primary.c70,
  color: p.theme.colors.neutral.c00,
}))`
  padding: 5px;
  min-width: 24px;
`;

interface HeaderBottomBarProps {
  left: number;
  width: number;
}

const MyBottomBar = (props: HeaderBottomBarProps) => {
  const { width, left } = props;
  return (
    <>
      <HeaderBottomBarFixed />
      <HeaderBottomBarMoving width={width} left={left} />
    </>
  );
};

interface HeaderElementProps {
  title: string;
  selected: boolean;
  disabled: boolean;
  badge?: string | number;
  onClick: () => void;
}

const HeaderElement = forwardRef<HTMLDivElement, HeaderElementProps>((props, ref) => {
  const { onClick, badge, disabled, selected, title } = props;

  return (
    <TabHeaderBox ref={ref} disabled={disabled} onClick={onClick}>
      <HeaderTitle selected={selected}>{title}</HeaderTitle>
      {(badge || badge === 0) && <Badge>{badge}</Badge>}
    </TabHeaderBox>
  );
});

const MainContent = styled(Flex).attrs({
  flex: 1,
})<{ active?: boolean }>`
  width: 100%;
  color: ${p => (p.active ? p.theme.colors.neutral.c00 : p.theme.colors.neutral.c70)};
  background-color: ${p => (p.active ? p.theme.colors.neutral.c100 : p.theme.colors.neutral.c00)};
`;

export default function Tabs(props: Props): JSX.Element {
  const { tabs, onTabChange } = props;
  const [activeIndex, setActiveIndex] = useState(tabs[0].index);
  const [bottomBar, updateBottomBar] = useState<HeaderBottomBarProps>({ left: 0, width: 0 });
  const mainTab = activeIndex >= 0 ? tabs[activeIndex] : null;
  const refs = tabs.map(() => createRef<HTMLDivElement>());

  useEffect(() => {
    const newIndex = props.activeIndex || activeIndex;
    setActiveIndex(newIndex);

    if (refs[0].current) {
      const refIndex = tabs.findIndex(t => t.index === newIndex);
      const refsToHandle = refs.slice(0, refIndex);
      const width = refs[refIndex].current?.offsetWidth || 0;
      const left = refsToHandle.reduce((total, ref) => total + (ref.current?.offsetWidth || 0), 0);
      updateBottomBar({
        width,
        left,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const onTabClick = (index: number) => {
    const tab = tabs.find(t => t.index === index);
    if (tab && !tab.disabled) {
      setActiveIndex(index);
      onTabChange && onTabChange(index);
    }
  };

  return (
    <Container>
      <TabHeader>
        <TabHeaderContent>
          {tabs.map((tab, i) => (
            <HeaderElement
              ref={refs[i]}
              title={tab.title}
              selected={activeIndex === tab.index}
              badge={tab.badge}
              disabled={!!tab.disabled}
              onClick={() => onTabClick(tab.index)}
            />
          ))}
        </TabHeaderContent>
        <MyBottomBar width={bottomBar.width} left={bottomBar.left} />
      </TabHeader>
      <MainContent>{mainTab && mainTab.Component}</MainContent>
    </Container>
  );
}
