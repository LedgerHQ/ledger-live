import React from "react";
import styled from "styled-components/native";
import FlexBox from "../../Layout/Flex";

export type BaseTabsProps = {
  labels: string[];
  activeIndex?: number;
  onChange: (newIndex: number) => void;
  activeColor?: string;
  activeBg?: string;
  disabled?: boolean;
  size?: "small" | "medium";
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
  activeColor?: string;
  activeBg?: string;
};

export const TabsContainer = styled(FlexBox).attrs({
  flexDirection: "row",
  alignItems: "stretch",
})`
  width: 100%;
`;

const TemplateTabsGroup = ({ size, ...props }: TabsProps): React.ReactElement => {
  const { labels, activeIndex, onChange, Item } = props;
  return (
    <TabsContainer {...props}>
      {labels.map((label, index) => (
        <Item
          key={index}
          {...props}
          size={size}
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
