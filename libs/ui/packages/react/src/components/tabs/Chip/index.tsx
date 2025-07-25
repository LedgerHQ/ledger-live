import React, { useState } from "react";
import styled from "styled-components";
import Flex from "../../layout/Flex";

export type Props = React.PropsWithChildren<{
  /**
   * An optional callback that will be called when the active tab changes.
   */
  onTabChange?: (activeIndex: number) => void;
  /**
   * The tab index to mark as active when rendering for the first time.
   * If omitted, then initially no tabs will be selected.
   */
  initialActiveIndex?: number;
}>;
type ItemProps = {
  active: boolean;
};

const Container = styled(Flex).attrs({
  justifyContent: "space-between",
  flex: 1,
  columnGap: 1,
})`
  border: 1px solid ${p => p.theme.colors.opacityDefault.c10};
  border-radius: 12px;
  padding: 4px;
`;

const Item = styled(Flex).attrs({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})<ItemProps>`
  cursor: pointer;
  padding: 8px 12px 8px 12px;
  border-radius: 10px;
  color: ${p => (p.active ? p.theme.colors.neutral.c100 : p.theme.colors.neutral.c50)};
  background-color: ${p => (p.active ? p.theme.colors.opacityDefault.c10 : "unset")};
`;

export default function BarTabs({ children, onTabChange, initialActiveIndex }: Props): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
  return (
    <Container>
      {React.Children.toArray(children).map((child, index) => (
        <Item
          key={index}
          active={index === activeIndex}
          onClick={() => {
            setActiveIndex(index);
            onTabChange && onTabChange(index);
          }}
        >
          {child}
        </Item>
      ))}
    </Container>
  );
}
