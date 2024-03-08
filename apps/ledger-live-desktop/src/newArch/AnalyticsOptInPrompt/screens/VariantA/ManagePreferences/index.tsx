import React, { useEffect, useState } from "react";
import { ManagePreferencesBody } from "./components";
import { Header } from "LLD/AnalyticsOptInPrompt/screens/components";
import { Flex } from "@ledgerhq/react-ui";
import { FieldKeySwitch } from "~/newArch/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

interface ManagePreferencesProps {
  onPreferencesChange: (preferences: Record<FieldKeySwitch, boolean>) => void;
}

const ManagePreferences = ({ onPreferencesChange }: ManagePreferencesProps) => {
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
    <Flex flexDirection={"column"} rowGap={"32px"} mx={"40px"} height={"100%"}>
      <Header title={"analyticsOptInPrompt.variantA.managePreferences"} />
      <ManagePreferencesBody onSwitchChange={handleSwitchChange} />
    </Flex>
  );
};

export default ManagePreferences;
