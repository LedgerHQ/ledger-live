import React, { useState, useRef, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Base } from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
const Tab = styled(Base)<{
  active: boolean;
}>`
  padding: 0 16px 4px 16px;
  border-radius: 0;
  flex: ${({ fullWidth }) => (fullWidth ? "1" : "initial")};
  display: flex;
  justify-content: center;
  color: ${p =>
    p.active ? p.theme.colors.palette.text.shade100 : p.theme.colors.palette.text.shade50};
  &:hover,
  &:active,
  &:focus {
    background: none;
    color: ${p => p.theme.colors.palette.text.shade100};
  }

  > * {
    font-size: ${p => p.fontSize}px;
  }
`;

type TabIndicatorProps = {
  currentRef: HTMLButtonElement | null;
  index: number;
  short: boolean;
};

const TabIndicator = styled.span.attrs<TabIndicatorProps>(({ currentRef, index, short }) => ({
  style: currentRef
    ? {
        width: `${currentRef.clientWidth - (short && index === 0 ? 16 : 32)}px`,
        transform: `translateX(${currentRef.offsetLeft}px)`,
      }
    : {},
}))<TabIndicatorProps>`
  height: 3px;
  position: absolute;
  bottom: 0;
  left: ${p => (p.short && p.index === 0 ? 0 : "16px")};
  background-color: ${p => p.theme.colors.palette.primary.main};
  transition: all 0.3s ease-in-out;
`;

export const TabBarRootStyled = styled.div<{
  short: boolean;
  separator: boolean;
  height?: number;
}>`
  height: ${p => p.height || p.theme.sizes.topBarHeight}px;
  display: flex;
  flex-direction: row;
  position: relative;
  align-items: flex-end;

  ${Tab}:first-child {
    ${p => (p.short ? "padding-left: 0;" : "")}
  }

  ${p =>
    p.separator
      ? `
    &:after {
    background: ${p.theme.colors.palette.divider};
    content: "";
    display: block;
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
    bottom: 0;
  }
  `
      : ""}
`;

type Props = {
  tabs: string[];
  ids?: string[];
  onIndexChange: (a: number) => void;
  defaultIndex?: number;
  index?: number;
  short?: boolean;
  separator?: boolean;
  withId?: boolean;
  fontSize?: number;
  fullWidth?: boolean;
  height?: number;
};

const TabBar = ({
  tabs,
  ids,
  onIndexChange,
  defaultIndex = 0,
  short = false,
  index: propsIndex,
  fullWidth = false,
  separator = false,
  withId = false,
  fontSize = 16,
  height,
}: Props) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState(defaultIndex);
  const [mounted, setMounted] = useState(false);
  const i = propsIndex !== undefined && !isNaN(propsIndex) ? propsIndex : index;
  useEffect(() => {
    setMounted(true);
  }, []);

  const setTabRef = (index: number) => (ref: HTMLButtonElement | null) => {
    tabRefs.current[index] = ref;
  };

  const updateIndex = useCallback(
    (j: number) => {
      setIndex(j);
      onIndexChange(j);
    },
    [setIndex, onIndexChange],
  );

  return (
    <TabBarRootStyled short={short} separator={separator} height={height}>
      {tabs.map((tab, j) => (
        <Tab
          ref={setTabRef(j)}
          key={`TAB_${j}_${tab}`}
          active={j === i}
          fullWidth={fullWidth}
          tabIndex={j}
          onClick={() => updateIndex(j)}
          data-testid={withId && ids?.length ? `${ids[j]}-tab` : ""}
          fontSize={fontSize}
        >
          <Text data-testid={`${tab}-tab-button`} ff="Inter|SemiBold" fontSize={5}>
            {tab}
          </Text>
        </Tab>
      ))}
      {mounted && tabRefs.current[i] && (
        <TabIndicator short={short} index={i} currentRef={tabRefs.current[i]} />
      )}
    </TabBarRootStyled>
  );
};
export default TabBar;
