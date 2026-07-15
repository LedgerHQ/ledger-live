import React from "react";
import {
  getSwapTransactionStatusVisualTokens,
  type SwapTransactionStatusDisplayStatus,
  type SwapTransactionStatusVisualIcon,
  type SwapTransactionStatusVisualTone,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill, Clock, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { StatusLine } from "./StatusLine";

type StatusRowProps = Readonly<{
  status: SwapTransactionStatusDisplayStatus;
  title: string;
  subtitle: string;
  value: React.ReactNode;
  valueCaption?: string;
  isLoading: boolean;
  lineStatus?: SwapTransactionStatusDisplayStatus;
  isLast?: boolean;
  testId?: string;
}>;

export function StatusRow({
  status,
  title,
  subtitle,
  value,
  valueCaption,
  isLoading,
  lineStatus,
  isLast,
  testId,
}: StatusRowProps) {
  const visualTokens = getSwapTransactionStatusVisualTokens(status);

  return (
    <Box testID={testId ? `${testId}-row` : undefined} lx={{ flexDirection: "row", gap: "s12" }}>
      <Box lx={{ alignItems: "center", width: "s20", paddingTop: "s1" }}>
        {renderStatusIcon(visualTokens.icon)}
        {isLast ? null : <StatusLine status={lineStatus ?? status} />}
      </Box>
      <Box lx={{ flex: 1, gap: "s2" }}>
        <Box
          lx={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: "s12",
          }}
        >
          {isLoading ? (
            <Skeleton lx={{ height: "s16", width: "s112" }} />
          ) : (
            <Text typography="body2SemiBold" lx={{ color: "base", flexShrink: 1 }}>
              {title}
            </Text>
          )}
          <Box lx={{ alignItems: "flex-end", gap: "s2" }}>
            {typeof value === "string" ? (
              <Text
                testID={testId ? `${testId}-amount` : undefined}
                typography="body2SemiBold"
                lx={{ color: "base", textAlign: "right" }}
              >
                {value}
              </Text>
            ) : (
              value
            )}
            {!isLoading && valueCaption ? (
              <Text typography="body3" lx={{ color: "muted", textAlign: "right" }}>
                {valueCaption}
              </Text>
            ) : null}
          </Box>
        </Box>
        {isLoading ? (
          <Skeleton lx={{ height: "s14", width: "s72" }} />
        ) : (
          <Text
            typography="body3"
            lx={{
              color: getStatusSubtitleColor(visualTokens.tone),
            }}
          >
            {subtitle}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function renderStatusIcon(icon: SwapTransactionStatusVisualIcon) {
  if (icon === "success") {
    return <CheckmarkCircleFill size={20} color="success" />;
  }
  if (icon === "error") {
    return <Warning size={20} color="error" />;
  }
  return <Clock size={20} color="muted" />;
}

function getStatusSubtitleColor(tone: SwapTransactionStatusVisualTone) {
  if (tone === "success") {
    return "success";
  }
  if (tone === "error") {
    return "error";
  }
  return "muted";
}
