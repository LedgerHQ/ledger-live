import React, { useCallback, useState } from "react";
import { Flex, Button } from "@ledgerhq/native-ui";
import TextInput from "~/components/TextInput";
import { pushToast } from "~/actions/toast";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch();

  const pushARandomIdToast = useCallback(() => {
    const id = `toast-${incrementedId}`;

    dispatch(
      pushToast({
        id,
        type: "success",
        icon: "success",
        title: `${id}: ${textInput}`,
      }),
    );

    setIncrementedId(prev => prev + 1);
  }, [incrementedId, dispatch, textInput]);

  const pushAToast = useCallback(() => {
    dispatch(
      pushToast({
        id: "debug_toast",
        type: "success",
        icon: "success",
        title: textInput,
      }),
    );
  }, [dispatch, textInput]);

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
