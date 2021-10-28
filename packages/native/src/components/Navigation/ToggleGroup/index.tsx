import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";
import { TouchableOpacity } from "react-native";
import Button from "../../cta/Button";
import FlexBox from "../../Layout/Flex";

export type ToggleGroupProps = {
  labels: string[];
  activeIndex: number;
  onChange: (newIndex: number) => void;
};

export const ToggleGroupContainer = styled(FlexBox).attrs({
  flexDirection: "row",
  alignItems: "stretch",
})`
  width: 100%;
  border: ${(p) => `1px solid ${p.theme.colors.palette.neutral.c40}`};
  border-radius: 35px;
  padding: 4px;
`;

export const ToggleBox = styled(TouchableOpacity)`
  text-align: center;
  margin: auto;
  flex: 1;
`;

const ToggleGroup = (props: ToggleGroupProps): React.ReactElement => {
  const { labels, activeIndex, onChange } = props;
  return (
    <ToggleGroupContainer>
      {labels.map((label, key) => (
        <ToggleBox key={key} onPress={() => onChange(key)}>
          {key === activeIndex ? (
            <Button type="main">{label}</Button>
          ) : (
            <Text lineHeight={36}>{label}</Text>
          )}
        </ToggleBox>
      ))}
    </ToggleGroupContainer>
  );
};

export default ToggleGroup;
