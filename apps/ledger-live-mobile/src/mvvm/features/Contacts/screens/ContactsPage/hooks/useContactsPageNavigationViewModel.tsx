import { useCallback, useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import { ContactsAddContactHeaderButton } from "@features/flow-contacts";

export function useContactsPageNavigationViewModel(
  addContactLabel: string,
  showAddContact: boolean,
  onAddContact: () => void,
  title?: string,
) {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();

  const renderTrailing = useCallback(
    () => (
      <ContactsAddContactHeaderButton addContactLabel={addContactLabel} onPress={onAddContact} />
    ),
    [addContactLabel, onAddContact],
  );

  useLayoutEffect(() => {
    const options: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        renderTrailing: showAddContact ? renderTrailing : undefined,
      },
      ...(title !== undefined && { title }),
    };

    navigation.setOptions(options);
  }, [navigation, renderTrailing, showAddContact, title]);
}
