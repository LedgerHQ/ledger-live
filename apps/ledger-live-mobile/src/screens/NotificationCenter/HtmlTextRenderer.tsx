import React from "react";
import { Text, Linking, StyleSheet, View } from "react-native";
import { Text as NativeUIText } from "@ledgerhq/native-ui";
import {
  useHtmlLinkSegments,
  type HtmlLinkSegment,
  validateLedgerUrl,
} from "@ledgerhq/live-common/hooks/useHtmlLinkSegments";
import { useTheme } from "styled-components/native";
import uniqueId from "lodash/uniqueId";
import { TextVariants } from "@ledgerhq/native-ui/lib/styles/theme";

type HtmlTextRendererProps = {
  html: string;
  variant?: TextVariants;
  fontWeight?: "medium" | "semiBold" | "bold";
  color?: string;
  numberOfLines?: number;
};

/**
 * Parse HTML text and render links as clickable Text components
 * Supports <a href="url">text</a> tags
 */

export const HtmlTextRenderer: React.FC<HtmlTextRendererProps> = ({
  html,
  variant = "bodyLineHeight",
  fontWeight = "medium",
  color = "neutral.c70",
  numberOfLines,
}) => {
  const { colors } = useTheme();
  const { segments, hasLinks } = useHtmlLinkSegments(html);

  if (!html) {
    return null;
  }

  // If no links were found, return plain text
  if (!hasLinks) {
    // Remove any remaining HTML tags that weren't links
    return (
      <NativeUIText
        variant={variant}
        fontWeight={fontWeight}
        color={color}
        numberOfLines={numberOfLines}
      >
        {html}
      </NativeUIText>
    );
  }

  const textColor = color === "neutral.c70" ? colors.neutral.c70 : colors.neutral.c100;
  const linkColor = colors.primary.c80;

  return (
    <View>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 20,
          color: textColor,
        }}
        numberOfLines={numberOfLines}
      >
        {segments.map((segment: HtmlLinkSegment, index: number) => {
          if (segment.type === "link") {
            return (
              <Text
                key={uniqueId(`link-${index}`)}
                style={[styles.link, { color: linkColor }]}
                onPress={async () => {
                  try {
                    const { isHttp, isAllowedLedgerDomain } = validateLedgerUrl(segment.href);

                    if (!isHttp || !isAllowedLedgerDomain) {
                      console.warn("[HtmlTextRenderer] Blocked non-Ledger URL:", segment.href);
                      return;
                    }

                    await Linking.openURL(segment.href);
                  } catch (error) {
                    console.error("[HtmlTextRenderer] Error opening URL:", error);
                  }
                }}
              >
                {segment.label}
              </Text>
            );
          }

          if (!segment.content.trim()) {
            return null;
          }

          return <Text key={uniqueId(`text-${index}`)}>{segment.content}</Text>;
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "underline",
  },
});
