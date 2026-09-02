import React from "react";
import { Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";

export type QaInspectorFieldTone = "success" | "error" | "warning" | "gray";

export type QaInspectorField = {
  label: string;
  /** Large primary value the tester should read first. */
  value: string;
  /** Small secondary line, typically the raw stored form. */
  raw?: string;
  /** Tag shown next to the label: Valid, Invalid, Missing, On, Off… */
  status: { label: string; tone: QaInspectorFieldTone };
};

export function QaInspectorRow({ field }: Readonly<{ field: QaInspectorField }>) {
  return (
    <Box
      lx={{
        paddingHorizontal: "s8",
        paddingVertical: "s12",
        borderRadius: "sm",
        marginBottom: "s8",
        gap: "s8",
        borderWidth: "s1",
        borderColor: "muted",
      }}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "s8",
        }}
      >
        <Text typography="body2SemiBold" lx={{ color: "base", flex: 1 }}>
          {field.label}
        </Text>
        <Tag label={field.status.label} size="sm" appearance={field.status.tone} />
      </Box>
      <Text typography="body2SemiBold" lx={{ color: "base" }} selectable>
        {field.value}
      </Text>
      {field.raw ? (
        <Text typography="body3" lx={{ color: "muted" }} selectable>
          {field.raw}
        </Text>
      ) : null}
    </Box>
  );
}
