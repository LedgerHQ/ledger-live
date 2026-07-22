import React from "react";
import { Box, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { DeleteCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CONTACT_NAME_MAX_LENGTH } from "../../../add/model/constants";

type ContactNameInputProps = Readonly<{
  value: string;
  placeholder: string;
  errorMessage?: string;
  onChangeText: (name: string) => void;
}>;

export function ContactNameInput({
  value,
  placeholder,
  errorMessage,
  onChangeText,
}: ContactNameInputProps): React.JSX.Element {
  const isAtNameLengthLimit = value.length === CONTACT_NAME_MAX_LENGTH;

  return (
    <Box lx={{ gap: "s8" }}>
      <TextInput
        testID="contacts-add-contact-name-input"
        autoFocus
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        maxLength={CONTACT_NAME_MAX_LENGTH}
        status={errorMessage ? "error" : undefined}
      />
      <Box
        lx={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {errorMessage ? (
          <Box
            lx={{
              alignItems: "center",
              flex: 1,
              flexDirection: "row",
              gap: "s4",
            }}
          >
            <DeleteCircleFill color="error" size={16} />
            <Text
              testID="contacts-add-contact-name-error"
              typography="body3"
              accessibilityLiveRegion="polite"
              lx={{ color: "error" }}
            >
              {errorMessage}
            </Text>
          </Box>
        ) : (
          <Box lx={{ flex: 1 }} />
        )}
        <Text
          testID="contacts-add-contact-name-count"
          typography="body3"
          accessibilityLiveRegion="polite"
          lx={{ color: isAtNameLengthLimit ? "error" : "muted" }}
        >
          {`${value.length}/${CONTACT_NAME_MAX_LENGTH}`}
        </Text>
      </Box>
    </Box>
  );
}
