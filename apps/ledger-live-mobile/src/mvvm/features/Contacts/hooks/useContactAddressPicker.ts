import { useCallback, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact, ContactAddress } from "@domain/entity-contact";
import {
  useContactAddressPickerViewModel,
  type ContactAddressPickerProps,
} from "@features/flow-pay-contact";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export type UseContactAddressPicker = Readonly<{
  open: (contact: Contact) => void;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function useContactAddressPicker({
  onSelectAddress,
}: Readonly<{
  onSelectAddress: (address: ContactAddress) => void;
}>): UseContactAddressPicker {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const closeRef = useRef(() => {});

  const onAddNewAddress = useCallback(
    (contact: Contact) => {
      closeRef.current();
      navigation.navigate(NavigatorName.MyWallet, {
        screen: ScreenName.MyWalletContactDetail,
        params: { contactId: contact.id },
      });
    },
    [navigation],
  );

  const { open, close, contactAddressPicker } = useContactAddressPickerViewModel({
    onSelectAddress: (address: ContactAddress) => {
      closeRef.current();
      onSelectAddress(address);
    },
    onAddNewAddress,
  });
  closeRef.current = close;

  return { open, contactAddressPicker };
}
