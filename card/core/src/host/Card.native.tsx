import { Suspense } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { components } from "../registry";
import { CardSkeleton } from "./CardSkeleton/CardSkeleton.native";

export const Card = () => {
  return (
    <Box lx={{ flexDirection: "column", gap: "s16" }}>
      {components.map(({ id, Component }) => (
        <Suspense key={id} fallback={<CardSkeleton />}>
          <Component />
        </Suspense>
      ))}
    </Box>
  );
};
