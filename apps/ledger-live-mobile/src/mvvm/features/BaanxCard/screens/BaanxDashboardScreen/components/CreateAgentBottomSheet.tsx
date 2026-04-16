import React, { memo, useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetView,
  BottomSheetHeader,
  TextInput,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectItemText,
} from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "~/mvvm/components/QueuedDrawer/QueuedDrawerBottomSheet";

const SNAP_POINTS = ["90%"];

const ROLE_OPTIONS = [
  { value: "dca", label: "DCA Strategy" },
  { value: "yield", label: "Yield Farming" },
  { value: "staking", label: "Staking" },
  { value: "rebalancer", label: "Portfolio Rebalancer" },
  { value: "tax", label: "Tax Optimizer" },
  { value: "custom", label: "Custom" },
] as const;

export interface CreateAgentFormData {
  readonly name: string;
  readonly address: string;
  readonly role: string;
}

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: CreateAgentFormData) => void;
}

const CreateAgentBottomSheet = memo(function CreateAgentBottomSheet({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setAddress("");
    setSelectedRole("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !selectedRole) return;

    const roleLabel = ROLE_OPTIONS.find(r => r.value === selectedRole)?.label ?? selectedRole;
    onSubmit({
      name: name.trim(),
      address: address.trim(),
      role: roleLabel,
    });
    resetForm();
  }, [name, address, selectedRole, onSubmit, resetForm]);

  const isFormValid = name.trim().length > 0 && selectedRole.length > 0;

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      snapPoints={SNAP_POINTS}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: bottomInset + 24 }]}>
        <BottomSheetHeader title="Create Agent" />

        <View style={styles.form}>
          <TextInput label="Agent name" value={name} onChangeText={setName} />

          <TextInput
            label="Wallet address (optional)"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <SelectItemText>{option.label}</SelectItemText>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttonContainer}>
          <Button
            appearance="accent"
            size="md"
            isFull
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            Create
          </Button>
        </View>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  form: {
    gap: 16,
    paddingTop: 16,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingTop: 16,
  },
});

export default CreateAgentBottomSheet;
