import { IconsLegacy } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import SettingsRow from "~/components/SettingsRow";
import { useAppProtectionPrompt } from "../../AppProtectionPrompt";

export function ProtectionPromptDebugRow(): React.JSX.Element {
  const { requestProtection } = useAppProtectionPrompt();
  const [outcome, setOutcome] = useState<string | undefined>(undefined);

  const onPress = useCallback(async () => {
    setOutcome("waiting for an answer…");
    setOutcome(
      (await requestProtection()) ? "protected: caller resumed" : "dismissed: caller held",
    );
  }, [requestProtection]);

  return (
    <SettingsRow
      title="App protection prompt"
      desc={outcome ?? "Ask the user to protect the app, as a Card entry point would"}
      iconLeft={<IconsLegacy.LockMedium size={24} color="black" />}
      onPress={onPress}
      testID="debug-app-protection-prompt"
    />
  );
}
