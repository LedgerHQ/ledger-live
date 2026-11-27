import React, { useCallback, type KeyboardEvent, type MouseEvent } from "react";
import { Link, ListItemDescription } from "@ledgerhq/lumen-ui-react";
import type { SettingsRowDescriptionProps } from "./SettingsRowDescription.types";

export function SettingsRowDescription({
  description,
  link,
  disabled,
}: SettingsRowDescriptionProps) {
  const onLinkClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      link?.onSelect();
    },
    [link],
  );
  // The row handles Enter and Space itself and would take the link's activation.
  const onLinkKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  }, []);

  return (
    <>
      {description ? (
        <ListItemDescription className="whitespace-normal">{description}</ListItemDescription>
      ) : null}
      {link ? (
        <Link asChild size="sm" underline disabled={disabled} className="cursor-pointer">
          <button type="button" onClick={onLinkClick} onKeyDown={onLinkKeyDown} disabled={disabled}>
            {link.label}
          </button>
        </Link>
      ) : null}
    </>
  );
}
