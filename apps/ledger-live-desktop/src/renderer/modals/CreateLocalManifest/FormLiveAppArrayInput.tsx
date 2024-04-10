import { Flex } from "@ledgerhq/react-ui";
import React, { useEffect, useState } from "react";
import Text from "~/renderer/components/Text";
import { Chip, ChipContainer } from "./Chip";
import Cross from "~/renderer/icons/Cross";
import Input from "~/renderer/components/Input";
import FormLiveAppHeader from "./FormLiveAppHeader";
import { DESCRIPTIONS } from "./defaultValues";

type Props = {
  fieldName: string;
  initialValue: string[];
  optional: boolean;
  parseCheck: boolean;
  path: string;
  handleChange: (path: string, value: unknown) => void;
};

function FormLiveAppArray({
  fieldName,
  initialValue,
  optional,
  parseCheck,
  path,
  handleChange,
}: Props) {
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<string[]>(initialValue);

  useEffect(() => {
    handleChange(path, selectedValues);
  }, [handleChange, path, selectedValues]);

  const removeItem = (item: string) => {
    setSelectedValues((prev: string[]) => {
      return prev.filter(option => option !== item);
    });
  };

  const handleOnEnter = () => {
    if (selectedValues.includes(inputValue) || inputValue.trim() === "") return;
    setSelectedValues((prev: string[]) => {
      const newSelectedvalues = prev;
      newSelectedvalues.push(inputValue);
      return newSelectedvalues;
    });
    setInputValue("");
  };

  return (
    <>
      <Flex flexDirection={"column"}>
        <FormLiveAppHeader
          fieldName={fieldName}
          description={DESCRIPTIONS[fieldName]}
          optional={optional}
        />
        <Input
          error={!parseCheck}
          onEnter={handleOnEnter}
          placeholder={optional ? "optional" : "required"}
          onChange={setInputValue}
          value={inputValue}
        />
        <Flex marginTop={2} rowGap={2} flexWrap={"wrap"} columnGap={2} maxHeight={"100%"}>
          {selectedValues.map((enumItem, index) => (
            <ChipContainer key={enumItem}>
              <Chip
                style={{
                  display: "flex",
                  alignContent: "center",
                  cursor: "initial",
                  height: "min-content",
                }}
                active={true}
                key={index}
              >
                <Text ff="Inter|Medium" fontSize={4}>
                  {enumItem}
                </Text>
                <div
                  onClick={() => removeItem(enumItem)}
                  style={{
                    width: "min-content",
                    height: "max-content",
                    margin: "auto",
                    marginLeft: "3px",
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  <Cross size={10} />
                </div>
              </Chip>
            </ChipContainer>
          ))}
        </Flex>
      </Flex>
    </>
  );
}

export default FormLiveAppArray;
