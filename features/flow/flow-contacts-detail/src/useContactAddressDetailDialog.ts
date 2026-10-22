import type { ContactAddressId } from "@domain/entity-contact";
import { useCallback, useEffect, useMemo, useState } from "react";
import { findContactAddressDetailSelection } from "./model/findContactAddressDetailSelection";
import type { ContactDetailAddressRowIntent, PopulatedContactDetailViewModel } from "./types";

export function useContactAddressDetailDialog(
  populatedContactDetail: PopulatedContactDetailViewModel | undefined,
): Readonly<{
  isOpen: boolean;
  selection: ReturnType<typeof findContactAddressDetailSelection>;
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
  onClose: () => void;
  clearSelection: () => void;
}> {
  const [selectedAddressId, setSelectedAddressId] = useState<ContactAddressId | undefined>();

  const clearSelection = useCallback(() => {
    setSelectedAddressId(undefined);
  }, []);
  const onAddressRowPress = useCallback((intent: ContactDetailAddressRowIntent) => {
    setSelectedAddressId(intent.addressId);
  }, []);
  const onClose = clearSelection;
  const selection = useMemo(
    () =>
      selectedAddressId === undefined || populatedContactDetail === undefined
        ? undefined
        : findContactAddressDetailSelection(
            populatedContactDetail.addressGroups,
            selectedAddressId,
          ),
    [populatedContactDetail, selectedAddressId],
  );

  useEffect(() => {
    if (selectedAddressId !== undefined && selection === undefined) {
      setSelectedAddressId(undefined);
    }
  }, [selectedAddressId, selection]);

  return {
    isOpen: selection !== undefined,
    selection,
    onAddressRowPress,
    onClose,
    clearSelection,
  };
}
