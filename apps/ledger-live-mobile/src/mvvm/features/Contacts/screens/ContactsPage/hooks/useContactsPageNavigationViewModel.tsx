import { useCallback, useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import { ContactsAddContactHeaderButton } from "@features/flow-contacts";

export function useContactsPageNavigationViewModel(
  addContactLabel: string,
  onAddContact: () => void,
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
    const opts: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        renderTrailing,
      },
    };

    navigation.setOptions(opts);
  }, [navigation, renderTrailing]);
}
