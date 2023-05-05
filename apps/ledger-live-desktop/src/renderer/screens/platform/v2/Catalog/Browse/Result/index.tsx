import React from "react";
import { Grid } from "@ledgerhq/react-ui";
import { DisclaimerRaw } from "@ledgerhq/live-common/wallet-api/react";
import { FullCard } from "../../Card";
import { NoResult } from "./NoResult";
import { Search } from "../../../hooks";

export function Result({
  search,
  disclaimer,
}: {
  search: Pick<Search, "result" | "input">;
  disclaimer: Pick<DisclaimerRaw, "onSelect">;
}) {
  if (!search.result.length) {
    return <NoResult input={search.input} />;
  }

  return (
    <Grid columns={3} gridGap={4}>
      {search.result.map(m => (
        <FullCard key={m.id} manifest={m} onClick={disclaimer.onSelect} />
      ))}
    </Grid>
  );
}
