import React from "react";
import Markdown from "@ronradtke/react-native-markdown-display";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { MarkdownRenderBoundary } from "~/components/SafeMarkdown";

type SafeMarkdownProps = Readonly<{
  markdown: string;
}>;

export function SafeMarkdown({ markdown }: SafeMarkdownProps) {
  const markdownStyles = useStyleSheet(
    theme => ({
      body: {
        ...theme.typographies.body2,
        color: theme.colors.text.muted,
      },
      text: {
        ...theme.typographies.body2,
        color: theme.colors.text.muted,
      },
      strong: {
        ...theme.typographies.body2SemiBold,
        color: theme.colors.text.base,
      },
      heading1: {
        ...theme.typographies.heading4SemiBold,
        color: theme.colors.text.base,
        marginTop: theme.spacings.s24,
        marginBottom: theme.spacings.s8,
      },
      heading2: {
        ...theme.typographies.heading5SemiBold,
        color: theme.colors.text.base,
        marginTop: theme.spacings.s24,
        marginBottom: theme.spacings.s8,
      },
      heading3: {
        ...theme.typographies.heading5SemiBold,
        color: theme.colors.text.base,
        marginTop: theme.spacings.s16,
        marginBottom: theme.spacings.s8,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: theme.spacings.s16,
      },
    }),
    [],
  );

  return (
    <MarkdownRenderBoundary markdown={markdown}>
      <Markdown style={markdownStyles}>{markdown}</Markdown>
    </MarkdownRenderBoundary>
  );
}
