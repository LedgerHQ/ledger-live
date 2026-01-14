import React, { useState } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity, Modal } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

interface PickerOption {
  label: string;
  value: string;
}

interface PickerFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: PickerOption[];
  description?: string;
}

export const PickerField = ({
  label,
  value,
  onValueChange,
  options,
  description,
}: PickerFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <Flex mb={3}>
      <Text variant="body" fontWeight="medium" color="neutral.c100" mb={2}>
        {label}
      </Text>
      {description && (
        <Text variant="small" color="neutral.c70" mb={2}>
          {description}
        </Text>
      )}

      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <Flex
          backgroundColor="neutral.c30"
          borderRadius={8}
          borderWidth={1}
          borderColor="neutral.c50"
          px={3}
          py={3}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text variant="body" color="neutral.c100">
            {selectedOption?.label || "Select an option"}
          </Text>
          <Text variant="body" color="neutral.c70" style={{ fontSize: 16 }}>
            {isOpen ? "▲" : "▼"}
          </Text>
        </Flex>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setIsOpen(false)}
          activeOpacity={1}
        >
          <Flex flex={1} justifyContent="center" alignItems="center" px={4}>
            <TouchableOpacity activeOpacity={1} style={{ width: "100%", maxWidth: 300 }}>
              <Flex backgroundColor="neutral.c00" borderRadius={12} p={4} maxHeight={300}>
                <Text variant="h5" color="neutral.c100" fontWeight="semiBold" mb={3}>
                  {label}
                </Text>

                <ScrollView style={{ maxHeight: 200 }}>
                  {options.map(option => (
                    <TouchableOpacity key={option.value} onPress={() => handleSelect(option.value)}>
                      <Flex
                        py={3}
                        px={2}
                        backgroundColor={value === option.value ? "neutral.c40" : "transparent"}
                        borderRadius={6}
                        mb={1}
                      >
                        <Text
                          variant="body"
                          color={value === option.value ? "neutral.c100" : "neutral.c80"}
                          fontWeight={value === option.value ? "semiBold" : "medium"}
                        >
                          {option.label}
                        </Text>
                      </Flex>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Flex mt={3} pt={3} borderTopWidth={1} borderTopColor="neutral.c40">
                  <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Flex py={2} alignItems="center">
                      <Text variant="body" color="neutral.c70">
                        {"Cancel"}
                      </Text>
                    </Flex>
                  </TouchableOpacity>
                </Flex>
              </Flex>
            </TouchableOpacity>
          </Flex>
        </TouchableOpacity>
      </Modal>
    </Flex>
  );
};
