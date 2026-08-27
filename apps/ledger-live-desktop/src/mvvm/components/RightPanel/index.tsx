import React from "react";
import { Card } from "./Card";
import { Swap } from "./Swap";
import type { RightPanelVariant } from "LLD/components/Page/utils";

const RIGHT_PANEL_BY_VARIANT: Record<RightPanelVariant, React.ComponentType> = {
  swap: Swap,
  card: Card,
};

interface RightPanelProps {
  readonly variant: RightPanelVariant;
}

/**
 * RightPanel - Sidebar panel on the right side of the app.
 * Renders the content matching the resolved variant (Swap console or Pay Card).
 *
 * Note: Visibility and variant selection are controlled by PageView / usePageViewModel.
 */
const RightPanel = ({ variant }: RightPanelProps) => {
  const Content = RIGHT_PANEL_BY_VARIANT[variant];
  return <Content />;
};

export default RightPanel;
