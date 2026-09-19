import React from "react";
import {
  Box,
  Button,
  Skeleton,
  Subheader,
  SubheaderDescription,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { CardAuthError } from "./CardAuthError";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

type CardLoginNativeViewProps = Omit<
  CardLoginViewProps,
  "alreadyHaveCardLabel" | "onAlreadyHaveCardPress"
>;

export function CardLoginView({
  title,
  description,
  loginLabel,
  isLoading,
  isResolving,
  error,
  onLoginPress,
  intro,
}: CardLoginNativeViewProps) {
  return (
    <>
      {isResolving ? (
        <CardLoginSkeleton />
      ) : (
        <Box
          lx={{
            flexDirection: "column",
            gap: "s4",
          }}
        >
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s16" }}>
            <Subheader lx={{ flex: 1 }} style={{ minWidth: 0 }}>
              <SubheaderRow>
                <SubheaderTitle>{title}</SubheaderTitle>
              </SubheaderRow>
              <SubheaderDescription>{description}</SubheaderDescription>
            </Subheader>
            <Button
              appearance="base"
              size="md"
              loading={isLoading}
              disabled={isLoading}
              onPress={onLoginPress}
              accessibilityLabel={loginLabel}
            >
              {loginLabel}
            </Button>
          </Box>
        </Box>
      )}
      <CardAuthError error={error} />
      <CardLoginIntroView {...intro} />
    </>
  );
}

function CardLoginSkeleton() {
  return (
    <Box
      lx={{ flexDirection: "row", alignItems: "center", gap: "s16" }}
      testID="card-login-skeleton"
    >
      <Box lx={{ flex: 1, flexDirection: "column", gap: "s8" }}>
        <Skeleton lx={{ height: "s20", width: "s176", borderRadius: "full" }} />
        <Skeleton lx={{ height: "s12", width: "s112", borderRadius: "full" }} />
      </Box>
      <Skeleton lx={{ height: "s40", width: "s96", borderRadius: "full" }} />
    </Box>
  );
}
