import React from "react";
import styled from "styled-components/native";
import FlexBox from "../../Layout/Flex";

export type BaseTabsProps = {
  activeBg?: string;
  activeColor?: string;
  activeIndex?: number;
  gap?: string | number;
  disabled?: boolean;
  inactiveBg?: string;
  inactiveColor?: string;
  labels: string[];
  onChange: (newIndex: number) => void;
  size?: "small" | "medium";
  stretchItems?: boolean;
};

export type TabItemProps = Partial<BaseTabsProps> & {
  label: string;
  isActive: boolean;
  index: number;
  onPress: () => void;
  activeColor?: string;
  activeBg?: string;
  disabled?: boolean;
};

export type TabsProps = BaseTabsProps & {
  Item: (props: TabItemProps) => React.ReactElement;
};

export const TabsContainer = styled(FlexBox)<{ stretchItems: boolean }>`
  // Avoid conflict with styled-system's size property by nulling size and renaming it
  size: undefined;
  flex-direction: row;
  width: 100%;
  align-items: ${(p) => (p.stretchItems ? "stretch" : "center")};
`;

const TemplateTabsGroup = ({
  gap,
  size,
  stretchItems = false,
  ...props
}: TabsProps): React.ReactElement => {
  const { labels, activeIndex, onChange, Item } = props;
  return (
    <TabsContainer columnGap={gap} stretchItems={stretchItems} {...props}>
      {labels.map((label, index) => (
        <Item
          key={index}
          {...props}
          index={index}
          isActive={index === activeIndex}
          label={label}
          size={size}
          stretchItems={stretchItems}
          onPress={() => onChange(index)}
        />
      ))}
    </TabsContainer>
  );
};

export default TemplateTabsGroup;
