import React, { type ReactNode } from "react";
import { Switch } from "@ledgerhq/lumen-ui-react";

interface SectionCardProps {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly onEnabledChange: (value: boolean) => void;
  readonly children?: ReactNode;
}

export const SectionCard = ({
  name,
  title,
  description,
  enabled,
  onEnabledChange,
  children,
}: SectionCardProps) => (
  <div className="flex flex-col gap-6 rounded-md border border-muted p-6">
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <span className="body-2-semi-bold text-base">{title}</span>
        <span className="body-3 text-muted">{description}</span>
      </div>
      <Switch name={name} selected={enabled} onChange={onEnabledChange} />
    </div>
    {enabled && children}
  </div>
);
