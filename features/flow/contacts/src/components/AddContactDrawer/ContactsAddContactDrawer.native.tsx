import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { DeleteCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CONTACT_NAME_MAX_LENGTH } from "../../add/model/constants";
import type { ContactsAddContactDrawerProps } from "./types";

export function ContactsAddContactDrawer({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  bottomInset = 0,
  keyboardInset = 0,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactDrawerProps): React.JSX.Element {
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];
  const isAtNameLengthLimit = draftName.length === CONTACT_NAME_MAX_LENGTH;

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <Box lx={{ gap: "s16", paddingHorizontal: "s16" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {labels.title}
            </Text>
            <Box lx={{ gap: "s8" }}>
              <TextInput
                testID="contacts-add-contact-name-input"
                autoFocus
                label={labels.namePlaceholder}
                value={draftName}
                onChangeText={onDraftNameChange}
                maxLength={CONTACT_NAME_MAX_LENGTH}
                status={invalidNameError === null ? undefined : "error"}
              />
              <Box
                lx={{
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {nameValidationError ? (
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
                      {nameValidationError}
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
                  {`${draftName.length}/${CONTACT_NAME_MAX_LENGTH}`}
                </Text>
              </Box>
            </Box>
            <Banner appearance="info" description={labels.namingDisclaimer} />
          </Box>
          <Button
            appearance="base"
            size="lg"
            isFull
            disabled={!isConfirmEnabled}
            loading={isSaving}
            onPress={onConfirm}
          >
            {labels.confirmName}
          </Button>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
