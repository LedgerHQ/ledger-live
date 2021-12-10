import React from "react";
import styled from "styled-components/native";
import FlexBox from "../../Layout/Flex";

export type BaseTabsProps = {
  labels: string[];
  activeIndex: number;
  onChange: (newIndex: number) => void;
};

export type TabItemProps = Partial<BaseTabsProps> & {
  label: string;
  isActive: boolean;
  index: number;
  onPress: () => void;
};

export type TabsProps = BaseTabsProps & {
  Item: (props: TabItemProps) => React.ReactElement;
};

export const TabsContainer = styled(FlexBox).attrs({
  flexDirection: "row",
  alignItems: "stretch",
})`
  width: 100%;
`;

const TemplateTabsGroup = (props: TabsProps): React.ReactElement => {
  const { labels, activeIndex, onChange, Item } = props;
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
        />
      ))}
    </TabsContainer>
  );
};

export default TemplateTabsGroup;
