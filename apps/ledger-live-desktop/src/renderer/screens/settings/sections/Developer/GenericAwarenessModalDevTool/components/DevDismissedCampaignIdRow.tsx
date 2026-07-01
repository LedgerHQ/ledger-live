import React from "react";

type DevDismissedCampaignIdRowProps = {
  id: string;
};

export const DevDismissedCampaignIdRow = ({ id }: DevDismissedCampaignIdRowProps) => (
  <li className="rounded-md border border-muted-subtle bg-canvas px-8 py-4">
    <span className="body-3 font-mono text-muted">{id}</span>
  </li>
);
