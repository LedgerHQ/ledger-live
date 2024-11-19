import { Flex } from "@ledgerhq/react-ui";
import React, { useEffect, useState } from "react";
import Text from "~/renderer/components/Text";
import { Chip, ChipContainer } from "./Chip";
import Cross from "~/renderer/icons/Cross";
import Select from "~/renderer/components/Select";
import FormLiveAppHeader from "./FormLiveAppHeader";
import { DESCRIPTIONS } from "./defaultValues";

type Props = {
  fieldName: string;
  initialValue: string[];
  optional: boolean;
  parseCheck: boolean;
  options?: string[];
  path: string;
  handleChange: (path: string, value: unknown) => void;
};
type Option = {
  value: string;
  label: string;
};

function FormLiveAppArraySelect({
  fieldName,
  initialValue,
  optional,
  options,
  parseCheck,
  path,
  handleChange,
}: Props) {
  const [selectedValues, setSelectedValues] = useState<string[]>(initialValue);
  const [optionsAvailable, setOptionsAvailable] = useState<Option[]>(
    options
      ? options
          .filter(option => !initialValue.includes(option))
          .map(option => ({ value: option, label: option }))
      : [],
  );

  useEffect(() => {
    handleChange(path, selectedValues);
  }, [handleChange, path, selectedValues]);

  const handleOnChange = (item: Option) => {
    setOptionsAvailable((prev: Option[]) => {
      return prev.filter(option => option.value != item.value);
    });
    setSelectedValues((prev: string[]) => {
      const newSelectedvalues = [...prev];
      newSelectedvalues.push(item.value);
      return newSelectedvalues;
    });
  };

  const removeItem = (item: string) => {
    setSelectedValues((prev: string[]) => {
      return prev.filter(option => option !== item);
    });
    setOptionsAvailable((prev: Option[]) => {
      const newSelectedvalues = [...prev];
      newSelectedvalues.push({ value: item, label: item });
      return newSelectedvalues;
    });
  };

  const handleOnEnter = (value: string) => {
    if (selectedValues.includes(value)) return;

    setSelectedValues((prev: string[]) => {
      const newSelectedvalues = [...prev];
      newSelectedvalues.push(value);
      return newSelectedvalues;
    });
  };

  return (
    <>
      <Flex flexDirection={"column"}>
        <FormLiveAppHeader
          fieldName={fieldName}
          description={DESCRIPTIONS[fieldName]}
          optional={optional}
        />
        <Select
          blurInputOnSelect={true}
          onKeyDown={e => {
            const target = e.target as HTMLTextAreaElement;
            if (e.keyCode === 13 && target.value !== "") {
              e.preventDefault();
              handleOnEnter(target.value);
              target.blur();
            }
          }}
          error={parseCheck ? null : new Error()}
          onChange={(option: unknown) => {
            handleOnChange(option as Option);
          }}
          value={null}
          noOptionsMessage={() => "No more option available"}
          options={optionsAvailable}
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

export default FormLiveAppArraySelect;
