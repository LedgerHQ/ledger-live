import React, { useEffect, useState } from "react";
import { ManagePreferencesBody } from "./components";
import { HeaderTitle } from "LLD/AnalyticsOptInPrompt/screens/components";
import { Flex } from "@ledgerhq/react-ui";
import { FieldKeySwitch } from "LLD/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import Track from "~/renderer/analytics/Track";

interface ManagePreferencesProps {
  onPreferencesChange: (preferences: Record<FieldKeySwitch, boolean>) => void;
  shouldWeTrack: boolean;
}

const ManagePreferences = ({ onPreferencesChange, shouldWeTrack }: ManagePreferencesProps) => {
  const [preferencesChecked, setPreferencesChecked] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const handleSwitchChange = (key: FieldKeySwitch) => {
    setPreferencesChecked(prevState => ({ ...prevState, [key]: !prevState[key] }));
  };

  useEffect(() => {
    onPreferencesChange(preferencesChecked);
  }, [preferencesChecked, onPreferencesChange]);

  return (
    <>
      <Track
        onMount
        mandatory={shouldWeTrack}
        event={"Analytics opt-in prompt details"}
        page={"Analytics opt-in prompt details"}
      />
      <Flex flexDirection={"column"} rowGap={"32px"} mx={"40px"} height={"100%"}>
        <HeaderTitle title={"analyticsOptInPrompt.variantA.managePreferences"} />
        <ManagePreferencesBody onSwitchChange={handleSwitchChange} />
      </Flex>
    </>
  );
};

export default ManagePreferences;
