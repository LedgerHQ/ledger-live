import React from "react";
import { Pressable } from "react-native";
import { Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Folder,
  Link,
  Slideshow,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { CARD_SHAPE_LABELS, explainBlocker, type CardShape } from "./qaConsole";
const CARD_SHAPE_ICONS: Record<CardShape, typeof Folder> = {
  direct: CreditCard,
  category: Folder,
  categoryChild: Link,
  gam: Slideshow,
};
export function ShapeTag({ shape }: Readonly<{ shape: CardShape | undefined }>) {
  if (!shape) return null;
  return (
    <Tag
      label={CARD_SHAPE_LABELS[shape]}
      icon={CARD_SHAPE_ICONS[shape]}
      size="sm"
      appearance="accent-subtle"
    />
  );
}

export function SectionTitle({ title, subtitle }: Readonly<{ title: string; subtitle?: string }>) {
  return (
    <Box
      lx={{
        paddingHorizontal: "s24",
        paddingTop: "s24",
        paddingBottom: "s8",
        gap: "s4",
      }}
    >
      <Text typography="heading4SemiBold" lx={{ color: "base" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          {subtitle}
        </Text>
      ) : null}
    </Box>
  );
}
export function SectionCard({
  title,
  subtitle,
  trailing,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <Box
      lx={{
        backgroundColor: "surface",
        borderRadius: "md",
        marginHorizontal: "s12",
        marginBottom: "s12",
        overflow: "hidden",
      }}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: "s16",
          paddingTop: "s12",
          paddingBottom: "s4",
          gap: "s8",
        }}
      >
        <Box lx={{ flex: 1, gap: "s4" }}>
          <Text typography="body1SemiBold" lx={{ color: "base" }}>
            {title}
          </Text>
          {subtitle ? (
            <Text typography="body2" lx={{ color: "muted" }}>
              {subtitle}
            </Text>
          ) : null}
        </Box>
        {trailing}
      </Box>
      <Box lx={{ paddingBottom: "s8" }}>{children}</Box>
    </Box>
  );
}
export function CollapsibleSection({
  title,
  subtitle,
  trailing,
  isExpanded,
  onToggle,
  children,
  testID,
}: Readonly<{
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  testID?: string;
}>) {
  return (
    <Box
      lx={{
        backgroundColor: "surface",
        borderRadius: "md",
        marginHorizontal: "s12",
        marginBottom: "s12",
        overflow: "hidden",
      }}
    >
      <Pressable onPress={onToggle} testID={testID}>
        <Box
          lx={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: "s16",
            paddingVertical: "s12",
            gap: "s8",
          }}
        >
          <Box lx={{ flex: 1, gap: "s4" }}>
            <Text typography="body1SemiBold" lx={{ color: "base" }}>
              {title}
            </Text>
            {subtitle ? (
              <Text typography="body2" lx={{ color: "muted" }}>
                {subtitle}
              </Text>
            ) : null}
          </Box>
          {trailing}
          {isExpanded ? (
            <ChevronUp size={16} color="muted" />
          ) : (
            <ChevronDown size={16} color="muted" />
          )}
        </Box>
      </Pressable>
      {isExpanded ? (
        <Box
          lx={{
            paddingBottom: "s16",
            gap: "s8",
          }}
        >
          {children}
        </Box>
      ) : null}
    </Box>
  );
}
export function BlockerExplanation({
  blocker,
  emphasized,
}: Readonly<{ blocker: string; emphasized?: boolean }>) {
  return (
    <Box lx={{ gap: "s2" }}>
      <Text
        typography={emphasized ? "body2SemiBold" : "body2"}
        lx={{ color: emphasized ? "error" : "muted" }}
      >
        {explainBlocker(blocker)}
      </Text>
      <Text typography="body3" lx={{ color: "muted" }}>
        code: {blocker}
      </Text>
    </Box>
  );
}
