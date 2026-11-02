import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import type { ToolKind } from "@devtools/registry";
import type { MouseEventHandler, ReactNode } from "react";
import { KindTag } from "../KindTag/KindTag";
import { MiniTag } from "../MiniTag/MiniTag";

type ToolRowProps = Readonly<{
  title: string;
  description?: string;
  owner?: string;
  kind?: ToolKind;
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
  kind,
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
        className={`h-auto min-h-40 py-8 rounded-md ${isActive ? "bg-canvas hover:bg-canvas" : "hover:bg-muted-hover"} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <ListItemContent className="grow">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
            <ListItemTitle className="max-w-full shrink-0 body-3-semi-bold">
              {title} {kind && <KindTag kind={kind} />}
            </ListItemTitle>
            {owner && (
              <span className="ml-auto">
                <MiniTag label={owner} />
              </span>
            )}
          </div>
          {description && <ListItemDescription>{description}</ListItemDescription>}
        </ListItemContent>
        {trailing && <ListItemTrailing>{trailing}</ListItemTrailing>}
      </ListItem>
    </div>
  );
}
