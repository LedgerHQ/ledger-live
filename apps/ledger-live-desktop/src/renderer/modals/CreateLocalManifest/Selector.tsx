import { Flex } from "@ledgerhq/react-ui";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Text from "~/renderer/components/Text";

type Props = {
  fieldName: string;
  optional: boolean;
  choices: string[];
  multipleChoices: boolean;
  path: string;
  initalValue: string[] | string;
  handleChange: (path: string, value: unknown) => void;
};

const SelectorContainer = styled.div`
  display: inline-flex;
  cursor: pointer;
  width: max-content;
  overflow: hidden;
  border-radius: 10px;
  margin: 0px;
`;

const Item = styled.div<{
  active: boolean;
}>`
  color: ${p =>
    p.active ? p.theme.colors.palette.primary.contrastText : p.theme.colors.palette.text.shade20};
  background: ${p =>
    p.active ? p.theme.colors.palette.primary.main : p.theme.colors.palette.action.disabled};
  padding: 0px 8px 2px 8px;
`;

function Selector({
  choices,
  path,
  handleChange,
  fieldName,
  optional,
  multipleChoices,
  initalValue,
}: Props) {
  const [selectedValues, setValues] = useState<string[] | string>(
    initalValue ? (multipleChoices ? [...initalValue] : initalValue) : [],
  );

  useEffect(() => {
    handleChange(path, selectedValues);
  }, [handleChange, path, selectedValues]);

  const handleClick = (value: string) => {
    if (multipleChoices && typeof selectedValues != "string") {
      if (selectedValues.includes(value)) {
        setValues(selectedValues.filter(item => item !== value));
      } else {
        setValues(prev => [...prev, value]);
      }
    } else {
      setValues(value);
    }
  };

  return (
    <Flex flexDirection={"column"}>
      <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
        {`${fieldName} `}
        {!optional && <span style={{ color: "red" }}>*</span>}
      </Text>
      <SelectorContainer>
        {choices.map((enumItem, index) => (
          <Item
            active={selectedValues.includes(enumItem) || selectedValues == enumItem}
            onClick={() => {
              handleClick(enumItem);
            }}
            key={index}
          >
            <Text ff="Inter|Medium" fontSize={4}>
              {enumItem}
            </Text>
          </Item>
        ))}
      </SelectorContainer>
    </Flex>
  );
}

export default Selector;
