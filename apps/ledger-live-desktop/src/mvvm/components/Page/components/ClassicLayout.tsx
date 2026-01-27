import React from "react";
import styled, { DefaultTheme } from "styled-components";

type ThemedProps<P = unknown> = P & { theme: DefaultTheme };

export const getPagePaddingLeft = (p: ThemedProps) => p.theme.space[6];

export const getPagePaddingRight = (p: ThemedProps) =>
  p.theme.space[6] - p.theme.overflow.trackSize;

const PageScrollerContainer = styled.div`
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const PageScroller = styled.div`
  padding: ${p => p.theme.space[3]}px ${p => getPagePaddingLeft(p)}px;
  padding-right: ${p => getPagePaddingRight(p)}px;
  ${p => p.theme.overflow.y};
  display: flex;
  flex-direction: column;
  flex: 1;

  &::-webkit-scrollbar {
    width: ${p => p.theme.overflow.trackSize}px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${p => p.theme.colors.neutral.c40};
    border-radius: ${p => p.theme.overflow.trackSize}px;
  }

  &::-webkit-scrollbar-track {
    background-color: ${p => p.theme.colors.neutral.c20};
    border-radius: ${p => p.theme.overflow.trackSize}px;
  }
`;

const PageScrollTopSeparator = styled.div.attrs<{ $isAtUpperBound: boolean }>(p => ({
  style: {
    opacity: p.$isAtUpperBound ? 0 : 1,
  },
}))<{ $isAtUpperBound: boolean }>`
  position: absolute;
  pointer-events: none;
  left: 0;
  right: 0;
  height: 12px;
  box-sizing: border-box;
  z-index: 20;
  transition: opacity 250ms ease-in-out;
  background: linear-gradient(${p => p.theme.colors.background.default}, rgba(0, 0, 0, 0));

  &:after {
    content: "";
    width: 100%;
    height: 1px;
    display: block;
    background-color: ${p => p.theme.colors.neutral.c30};
  }
`;

const PageContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  height: 100%;
`;

interface ClassicLayoutProps {
  children: React.ReactNode;
  scrollerRef: (node: HTMLDivElement | null) => void;
  isScrollAtUpperBound: boolean;
}

/**
 * Classic Layout (pre-Wallet 4.0)
 * Uses styled-components matching the original Page.tsx
 */
export const ClassicLayout = ({
  children,
  scrollerRef,
  isScrollAtUpperBound,
}: ClassicLayoutProps) => (
  <PageScrollerContainer id="scroll-area">
    <PageScrollTopSeparator $isAtUpperBound={isScrollAtUpperBound} />
    <PageScroller id="page-scroller" ref={scrollerRef}>
      <PageContentContainer>{children}</PageContentContainer>
    </PageScroller>
  </PageScrollerContainer>
);
