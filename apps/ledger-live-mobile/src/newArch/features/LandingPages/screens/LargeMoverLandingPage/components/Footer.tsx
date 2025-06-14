import React from "react";
import { QuickActionList } from "@ledgerhq/native-ui";
import { QuickActionProps } from "~/hooks/useQuickActions";
import { useFooterQuickActions } from "../hooks/useFooterQuickAction";

export const Footer: React.FC<QuickActionProps> = props => {
  const quickActionsData = useFooterQuickActions(props);
  return (
    <QuickActionList
      data={quickActionsData}
      id={`${quickActionsData.length}_columns`}
      key={quickActionsData.length}
      numColumns={quickActionsData.length}
      isActive
      testID="button"
    />
  );
};
