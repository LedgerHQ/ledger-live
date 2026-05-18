import type { ComponentProps, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardFooter,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import { PnlCardIconStack } from "./PnlCardIconStack";
import { PnlStatsList } from "./PnlStatsList";
import type { PnlCardIcon, PnlHeadline, PnlStat } from "./types";

type PnlOutcomeCardProps = Readonly<{
  icons: PnlCardIcon[];
  iconSize?: ComponentProps<typeof PnlCardIconStack>["size"];
  title: ReactNode;
  description?: ReactNode;
  headline?: PnlHeadline;
  stats: PnlStat[];
  footer?: ReactNode;
}>;

export function PnlOutcomeCard({
  icons,
  iconSize,
  title,
  description,
  headline,
  stats,
  footer,
}: PnlOutcomeCardProps) {
  return (
    <Card type="info" className="w-full min-w-0 flex-1 lg:max-w-480">
      <CardHeader>
        <CardLeading>
          <PnlCardIconStack icons={icons} size={iconSize} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            {description !== undefined && (
              <CardContentDescription>{description}</CardContentDescription>
            )}
          </CardContent>
        </CardLeading>
        {headline ? (
          <CardTrailing>
            <CardContent>
              <CardContentTitle style={headline.tone}>{headline.value}</CardContentTitle>
              {headline.sub ? (
                <CardContentDescription style={headline.sub.tone}>
                  {headline.sub.value}
                </CardContentDescription>
              ) : null}
            </CardContent>
          </CardTrailing>
        ) : null}
      </CardHeader>

      <CardFooter className="flex flex-col gap-16">
        <PnlStatsList stats={stats} />
        {footer !== undefined && (
          <CardContentDescription className="pt-8">{footer}</CardContentDescription>
        )}
      </CardFooter>
    </Card>
  );
}
