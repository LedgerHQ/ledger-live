import React from "react";
import { Flex, QuickActionList } from "@ledgerhq/native-ui";
import { QuickActionProps } from "~/hooks/useQuickActions";
import { useFooterQuickActions } from "../hooks/useFooterQuickAction";

export const Footer: React.FC<QuickActionProps> = props => {
  const quickActionsData = useFooterQuickActions(props);
  return (
    <Flex>
      <QuickActionList
        data={quickActionsData}
        numColumns={3}
        id="asset_three_columns"
        isActive={true}
        testID="button"
      />
    </Flex>
  );
};
