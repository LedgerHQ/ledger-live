import React, { useCallback, useState } from "react";
import { Flex, Button } from "@ledgerhq/native-ui";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import TextInput from "~/components/TextInput";

/**
 * Debugging screen to test snackbars:
 * - opening/closing of a toast with the same id
 * - opening/closing of a toast with different ids
 *
 * TODO: test other types of toast (not `success`) and any kind of notifications, popups etc.
 * See also `apps/ledger-live-mobile/src/screens/Settings/Debug/Features/QueuedDrawers.tsx`
 */
export default function DebugSnackbars() {
  const [textInput, setTextInput] = useState("Example of a snackbar 🥨");
  const [incrementedId, setIncrementedId] = useState(0);
  const { pushToast } = useToasts();

  const pushARandomIdToast = useCallback(() => {
    const id = `toast-${incrementedId}`;

    pushToast({
      id,
      type: "success",
      icon: "success",
      title: `${id}: ${textInput}`,
    });

    setIncrementedId(prev => prev + 1);
  }, [pushToast, textInput, incrementedId]);

  const pushAToast = useCallback(() => {
    pushToast({
      id: "debug_toast",
      type: "success",
      icon: "success",
      title: textInput,
    });
  }, [pushToast, textInput]);

  return (
    <Flex flex={1}>
      <TextInput
        value={textInput}
        maxLength={100}
        onChangeText={setTextInput}
        placeholder={"Text to display in the toast"}
      />
      <Flex mt={6}>
        <Button type="main" onPress={pushARandomIdToast} size="small" outline>
          Push a toast with an incremented id 🎲
        </Button>
        <Button type="main" onPress={pushAToast} mt="4" size="small" outline>
          Push a toast with the same id 🍾
        </Button>
      </Flex>
    </Flex>
  );
}
