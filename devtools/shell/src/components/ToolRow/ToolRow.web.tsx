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

type ToolRowProps = Readonly<{
  title: string;
  description?: string;
  owner?: string;
  trailing?: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  isActive?: boolean;
  // Currently unused by ToolRowItem (the only consumer). Kept because the
  // underlying ListItem supports a disabled state and future callers may need it.
  disabled?: boolean;
}>;

export function ToolRow({
  title,
  description,
  owner,
  trailing,
  onClick,
  isActive,
  disabled,
}: ToolRowProps) {
  return (
    <div className="relative">
      <ListItem
        density="compact"
        onClick={disabled ? undefined : onClick}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={disabled}
        className={`rounded-md ${isActive ? "bg-active/10" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
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
