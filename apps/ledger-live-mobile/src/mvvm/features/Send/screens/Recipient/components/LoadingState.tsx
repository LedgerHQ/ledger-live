import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";

export function LoadingState() {
  return (
    <Box
      testID="send-recipient-card-skeleton"
      lx={{
        marginHorizontal: "s8",
        borderRadius: "lg",
        backgroundColor: "surface",
        overflow: "hidden",
      }}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          gap: "s12",
          padding: "s12",
        }}
      >
        <Skeleton lx={{ width: "s48", height: "s48", borderRadius: "full", flexShrink: 0 }} />
        <Box lx={{ flex: 1, gap: "s10" }}>
          <Skeleton lx={{ height: "s12", width: "s176", borderRadius: "full" }} />
          <Skeleton lx={{ height: "s12", width: "s112", borderRadius: "full" }} />
        </Box>
      </Box>
      <Box
        lx={{
          flexDirection: "row",
          gap: "s10",
          paddingHorizontal: "s12",
          paddingVertical: "s10",
        }}
      >
        <Box lx={{ flex: 1 }}>
          <Skeleton lx={{ height: "s40", width: "full", borderRadius: "full" }} />
        </Box>
        <Box lx={{ flex: 1 }}>
          <Skeleton lx={{ height: "s40", width: "full", borderRadius: "full" }} />
        </Box>
      </Box>
    </Box>
  );
}
