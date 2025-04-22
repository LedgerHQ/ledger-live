import React from "react";
import TabIcon from "~/components/TabIcon";
import { Icons } from "@ledgerhq/native-ui";

export default function PortfolioTabIcon(props: { color: string }) {
  return (
    <TabIcon
      Icon={() => <Icons.Wallet color={props.color} />}
      i18nKey="tabs.portfolio"
      {...props}
    />
  );
}
