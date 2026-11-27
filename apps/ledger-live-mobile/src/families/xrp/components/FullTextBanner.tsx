import React, { type ComponentProps } from "react";
import { Banner, Text } from "@ledgerhq/lumen-ui-rnative";

type Props = Omit<ComponentProps<typeof Banner>, "description"> &
  Readonly<{ description?: string }>;

/** Banner clamps a plain-text description to 5 lines; an element is rendered whole */
export function FullTextBanner({ description, ...props }: Props) {
  return (
    <Banner
      {...props}
      description={
        description ? (
          <Text typography="body2" lx={{ color: "base" }}>
            {description}
          </Text>
        ) : undefined
      }
    />
  );
}
