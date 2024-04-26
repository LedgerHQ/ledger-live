import { Flex } from "@ledgerhq/react-ui";
import React, { useEffect, useState } from "react";
import Text from "~/renderer/components/Text";
import { Chip, ChipContainer } from "./Chip";
import { DESCRIPTIONS } from "./defaultValues";
import FormLiveAppHeader from "./FormLiveAppHeader";

type Props = {
  fieldName: string;
  optional: boolean;
  choices: string[];
  multipleChoices: boolean;
  path: string;
  initalValue: string[] | string;
  handleChange: (path: string, value: unknown) => void;
};

function FormLiveAppSelector({
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
      <FormLiveAppHeader
        fieldName={fieldName}
        description={DESCRIPTIONS[fieldName]}
        optional={optional}
      />
      <ChipContainer
        style={{
          outline: (!optional && !selectedValues.length && "solid 1px red") || "",
          outlineOffset: "-1px",
        }}
      >
        {choices.map((enumItem, index) => (
          <Chip
            active={selectedValues.includes(enumItem) || selectedValues == enumItem}
            onClick={() => {
              handleClick(enumItem);
            }}
            key={index}
          >
            <Text ff="Inter|Medium" fontSize={4}>
              {enumItem}
            </Text>
          </Chip>
        ))}
      </ChipContainer>
    </Flex>
  );
}

export default FormLiveAppSelector;
