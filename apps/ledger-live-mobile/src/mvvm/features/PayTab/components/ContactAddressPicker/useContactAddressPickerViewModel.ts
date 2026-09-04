import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  createPopulatedContactDetailViewModel,
  defaultContactAddressCurrencyPort,
  type ContactDetailAddressNetworkGroup,
  type ContactDetailAddressRowIntent,
} from "@features/flow-contacts";
import type { ContactAddress } from "@domain/entity-contact";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import type { ContactAddressPickerProps } from "./types";

export type ContactAddressPickerViewModel = Readonly<{
  isOpen: boolean;
  title: string | undefined;
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
  onClose: () => void;
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
  onAddAddress: () => void;
}>;

export function useContactAddressPickerViewModel({
  contact,
  onClose,
  onSelectAddress,
}: ContactAddressPickerProps): ContactAddressPickerViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const addressGroups = useMemo(() => {
    if (!contact) {
      return [];
    }

    return createPopulatedContactDetailViewModel(contact, defaultContactAddressCurrencyPort)
      .addressGroups;
  }, [contact]);

  const onAddressRowPress = useCallback(
    (intent: ContactDetailAddressRowIntent) => {
      const address = contact?.addresses.find(
        (entry): entry is ContactAddress => entry.id === intent.addressId,
      );

      if (address) {
        onSelectAddress(address);
      }
    },
    [contact, onSelectAddress],
  );

  const onAddAddress = useCallback(() => {
    if (!contact) {
      return;
    }

    onClose();
    navigation.navigate(NavigatorName.MyWallet, {
      screen: ScreenName.MyWalletContactDetail,
      params: { contactId: contact.id },
    });
  }, [contact, navigation, onClose]);

  return {
    isOpen: contact !== null,
    title: contact?.name,
    addressGroups,
    onClose,
    onAddressRowPress,
    onAddAddress,
  };
}
