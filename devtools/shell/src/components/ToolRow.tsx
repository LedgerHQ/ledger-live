import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import type { MouseEventHandler, ReactNode } from "react";

interface ToolRowProps {
  title: string;
  description?: string;
  owner?: string;
  trailing?: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  isActive?: boolean;
}

export function ToolRow({ title, description, owner, trailing, onClick, isActive }: ToolRowProps) {
  return (
    <div className="relative">
      <ListItem
        density="compact"
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={`rounded-md ${isActive ? "bg-active/10" : ""}`}
      >
        {isActive && (
          <ListItemLeading className="absolute left-2 top-2 bottom-2" aria-hidden="true">
            <div className="w-[2px] rounded-sm bg-active h-1/2" />
          </ListItemLeading>
        )}
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          {description && <ListItemDescription>{description}</ListItemDescription>}
        </ListItemContent>
        {(owner || trailing) && (
          <ListItemTrailing>
            {owner && <Tag label={owner} appearance="gray" size="sm" />}
            {trailing}
          </ListItemTrailing>
        )}
      </ListItem>
    </div>
  );
}
