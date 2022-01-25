import React from "react";
import styled from "styled-components/native";
import FlexBox from "../../Layout/Flex";

export type BaseTabsProps = {
  labels: string[];
  activeIndex: number;
  onChange: (newIndex: number) => void;
  activeColor?: string;
  activeBg?: string;
};

export type TabItemProps = Partial<BaseTabsProps> & {
  label: string;
  isActive: boolean;
  index: number;
  onPress: () => void;
  activeColor?: string;
  activeBg?: string;
};

export type TabsProps = BaseTabsProps & {
  Item: (props: TabItemProps) => React.ReactElement;
  activeColor?: string;
  activeBg?: string;
};

export const TabsContainer = styled(FlexBox).attrs({
  flexDirection: "row",
  alignItems: "stretch",
})`
  width: 100%;
`;

const TemplateTabsGroup = (props: TabsProps): React.ReactElement => {
  const { labels, activeIndex, onChange, Item, activeColor, activeBg } = props;
  return (
    <TabsContainer {...props}>
      {labels.map((label, index) => (
        <Item
          key={index}
          {...props}
          label={label}
          index={index}
          isActive={index === activeIndex}
          onPress={() => onChange(index)}
          activeColor={activeColor}
          activeBg={activeBg}
        />
      ))}
    </TabsContainer>
  );
};

export default TemplateTabsGroup;
