import React from "react";
import { Flex, Grid, InfiniteLoader } from "@ledgerhq/react-ui";
import { DisclaimerRaw } from "@ledgerhq/live-common/wallet-api/react";
import { FullCard } from "../../Card";
import { NoResult } from "./NoResult";
import { Search } from "../../../hooks";

export function Result({
  search,
  disclaimer,
}: {
  search: Pick<Search, "result" | "input" | "isSearching">;
  disclaimer: Pick<DisclaimerRaw, "onSelect">;
}) {
  if (search.isSearching) {
    return (
      <Flex height={400} alignItems="center" justifyContent="center">
        <InfiniteLoader />
      </Flex>
    );
  }

  if (!!search.input.length && !search.result.length) {
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
