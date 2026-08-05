import React, { useState } from "react";
import { Box, Text, Divider } from "@ledgerhq/lumen-ui-rnative";
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
    <Box lx={{ marginBottom: "s8" }}>
      <Text typography="body2" lx={{ color: "base", marginBottom: "s4" }}>
        {label}
      </Text>
      {description && (
        <Text typography="body3" lx={{ color: "muted", marginBottom: "s4" }}>
          {description}
        </Text>
      )}

      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <Box
          lx={{
            backgroundColor: "surface",
            borderRadius: "md",
            borderColor: "muted",
            paddingHorizontal: "s8",
            paddingVertical: "s8",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          style={{ borderWidth: 1 }}
        >
          <Text typography="body2" lx={{ color: "base" }}>
            {selectedOption?.label || "Select an option"}
          </Text>
          <Text typography="body2" lx={{ color: "muted" }}>
            {isOpen ? "▲" : "▼"}
          </Text>
        </Box>
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
          <Box
            lx={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: "s12",
            }}
          >
            <TouchableOpacity activeOpacity={1} style={{ width: "100%", maxWidth: 300 }}>
              <Box
                lx={{ backgroundColor: "canvas", borderRadius: "lg", padding: "s12" }}
                style={{ maxHeight: 300 }}
              >
                <Text typography="heading5SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
                  {label}
                </Text>

                <ScrollView style={{ maxHeight: 200 }}>
                  {options.map(option => (
                    <TouchableOpacity key={option.value} onPress={() => handleSelect(option.value)}>
                      <Box
                        lx={{
                          paddingVertical: "s8",
                          paddingHorizontal: "s4",
                          borderRadius: "sm",
                          marginBottom: "s2",
                          ...(value === option.value ? { backgroundColor: "surface" } : {}),
                        }}
                      >
                        <Text
                          typography={value === option.value ? "body2SemiBold" : "body2"}
                          lx={{ color: value === option.value ? "base" : "muted" }}
                        >
                          {option.label}
                        </Text>
                      </Box>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Box lx={{ marginTop: "s8", paddingTop: "s8" }}>
                  <Divider />
                  <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Box lx={{ paddingVertical: "s4", alignItems: "center" }}>
                      <Text typography="body2" lx={{ color: "muted" }}>
                        {"Cancel"}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                </Box>
              </Box>
            </TouchableOpacity>
          </Box>
        </TouchableOpacity>
      </Modal>
    </Box>
  );
};
