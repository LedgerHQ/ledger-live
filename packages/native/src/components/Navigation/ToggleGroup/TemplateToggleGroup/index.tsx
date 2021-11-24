import React from "react";
import styled from "styled-components/native";
import FlexBox from "../../../Layout/Flex";

export type BaseToggleGroupProps = {
  labels: string[];
  activeIndex: number;
  onChange: (newIndex: number) => void;
};

export type ItemToggleGroupProps = Partial<BaseToggleGroupProps> & {
  label: string;
  isActive: boolean;
  index: number;
  onPress: () => void;
};

export type ToggleGroupProps = BaseToggleGroupProps & {
  Item: (props: ItemToggleGroupProps) => React.ReactElement;
};

export const ToggleGroupContainer = styled(FlexBox).attrs({
  flexDirection: "row",
  alignItems: "stretch",
})`
  width: 100%;
`;

const TemplateToggleGroup = (props: ToggleGroupProps): React.ReactElement => {
  const { labels, activeIndex, onChange, Item } = props;
  return (
    <ToggleGroupContainer {...props}>
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
    </ToggleGroupContainer>
  );
};

export default TemplateToggleGroup;
