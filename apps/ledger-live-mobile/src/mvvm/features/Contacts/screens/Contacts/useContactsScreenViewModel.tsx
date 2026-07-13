import { useCallback, useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import { ContactsAddContactHeaderButton } from "@features/flow-contacts";

export function useContactsScreenViewModel(addContactLabel: string) {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();

  const renderTrailing = useCallback(
    () => <ContactsAddContactHeaderButton addContactLabel={addContactLabel} />,
    [addContactLabel],
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
