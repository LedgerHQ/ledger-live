import React, { useEffect, useRef } from "react";
import type { TextInput as NativeTextInput } from "react-native";
import { CONTACT_NAME_MAX_LENGTH } from "@domain/entity-contact";
import { Box, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { DeleteCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";

type ContactNameInputProps = Readonly<{
  value: string;
  placeholder: string;
  errorMessage?: string;
  isEditable?: boolean;
  /**
   * Focuses the field whenever this turns true, rather than only on mount. Hosts inside an
   * animating drawer can keep it false until the drawer has settled, so the keyboard does not
   * resize the drawer while it is still opening.
   */
  autoFocus?: boolean;
  /** Namespaces the test ids, so each host drawer identifies its own input. */
  testIDPrefix?: string;
  onChangeText: (name: string) => void;
}>;

export function ContactNameInput({
  value,
  placeholder,
  errorMessage,
  isEditable = true,
  autoFocus = true,
  testIDPrefix = "contacts-add-contact",
  onChangeText,
}: ContactNameInputProps): React.JSX.Element {
  const isAtNameLengthLimit = value.length === CONTACT_NAME_MAX_LENGTH;
  const inputRef = useRef<NativeTextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <Box lx={{ gap: "s8" }}>
      <TextInput
        ref={inputRef}
        testID={`${testIDPrefix}-name-input`}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        maxLength={CONTACT_NAME_MAX_LENGTH}
        editable={isEditable}
        status={errorMessage ? "error" : undefined}
      />
      <Box
        lx={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: errorMessage ? "space-between" : "flex-end",
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
              testID={`${testIDPrefix}-name-error`}
              typography="body3"
              accessibilityLiveRegion="polite"
              lx={{ color: "error" }}
            >
              {errorMessage}
            </Text>
          </Box>
        ) : null}
        <Text
          testID={`${testIDPrefix}-name-count`}
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
