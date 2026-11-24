import React, { useCallback, type MouseEvent } from "react";
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

  return (
    <>
      {description ? (
        <ListItemDescription className="whitespace-normal">{description}</ListItemDescription>
      ) : null}
      {link ? (
        <Link asChild size="sm" underline disabled={disabled}>
          <button type="button" onClick={onLinkClick} disabled={disabled}>
            {link.label}
          </button>
        </Link>
      ) : null}
    </>
  );
}
