import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
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
    <Box lx={{ width: "100%", flexDirection: "column", gap: "s12" }}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      {status === "error" ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          {errorLabel}
        </Text>
      ) : null}
      {status === "empty" ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          {emptyLabel}
        </Text>
      ) : null}
      {status === "ready" ? (
        <Box lx={{ width: "100%", flexDirection: "column", gap: "s8" }}>
          {rows.map(row => (
            <ListItem key={row.id}>
              <ListItemTrailing>
                <ListItemContent>
                  <ListItemTitle>{row.cryptoAmount}</ListItemTitle>
                </ListItemContent>
              </ListItemTrailing>
            </ListItem>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
