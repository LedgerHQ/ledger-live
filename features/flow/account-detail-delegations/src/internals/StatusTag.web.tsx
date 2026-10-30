import React from "react";
import { Tag, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import type { DelegationStatus } from "../components/AccountDelegations/AccountDelegations.types";
import { TAG_APPEARANCE } from "./tagAppearance";

type Props = Readonly<{ status: DelegationStatus }>;

export const StatusTag = ({ status: { label, appearance, tooltip } }: Props) => {
  if (!tooltip) return <Tag appearance={TAG_APPEARANCE[appearance]} size="md" label={label} />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Tag appearance={TAG_APPEARANCE[appearance]} size="md" label={label} tabIndex={0} />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};
