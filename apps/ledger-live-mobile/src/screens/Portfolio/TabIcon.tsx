import React from "react";
import TabIcon from "~/components/TabIcon";
import { Home } from "@ledgerhq/lumen-ui-rnative/symbols";


export default function PortfolioTabIcon(props: { color: string }) {
  return <TabIcon Icon={Home} i18nKey="tabs.portfolio" {...props} />;
}
