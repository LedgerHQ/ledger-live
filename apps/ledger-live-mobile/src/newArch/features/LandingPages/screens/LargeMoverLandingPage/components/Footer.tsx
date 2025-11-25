import React from "react";
import { QuickActionList } from "@ledgerhq/native-ui";
import { QuickActionProps } from "~/hooks/useQuickActions";
import { useFooterQuickActions } from "../hooks/useFooterQuickAction";

export const Footer: React.FC<QuickActionProps> = props => {
  const quickActionsData = useFooterQuickActions(props);
  const columns = Math.max(1, quickActionsData.length);
  return (
    <QuickActionList
      data={quickActionsData}
      id={`${columns}_columns`}
      key={columns}
      numColumns={columns}
      isActive
      testID="button"
    />
  );
};
