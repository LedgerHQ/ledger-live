import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import type { CardAssetsViewModel } from "./types";

export function CardAssetsView({
  isVisible,
  title,
  status,
  rows,
  emptyLabel,
  errorLabel,
}: CardAssetsViewModel) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-12">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      {status === "error" ? <p className="body-2 text-muted">{errorLabel}</p> : null}
      {status === "empty" ? <p className="body-2 text-muted">{emptyLabel}</p> : null}
      {status === "ready" ? (
        <div className="flex w-full flex-col gap-8">
          {rows.map(row => (
            <ListItem key={row.id}>
              <ListItemTrailing>
                <ListItemContent>
                  <ListItemTitle>{row.cryptoAmount}</ListItemTitle>
                </ListItemContent>
              </ListItemTrailing>
            </ListItem>
          ))}
        </div>
      ) : null}
    </div>
  );
}
