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
import { PnlFieldsGroup } from "./PnlFieldsGroup";
import type { PnlCardIcon, PnlField, PnlStat } from "./types";

type PnlInputsCardProps = Readonly<{
  icons: PnlCardIcon[];
  iconSize?: ComponentProps<typeof PnlCardIconStack>["size"];
  title: ReactNode;
  description?: ReactNode;
  trailing?: PnlStat;
  fields: PnlField[];
  footer?: ReactNode;
}>;

export function PnlInputsCard({
  icons,
  iconSize,
  title,
  description,
  trailing,
  fields,
  footer,
}: PnlInputsCardProps) {
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
        {trailing ? (
          <CardTrailing>
            <CardContent>
              <CardContentTitle>{trailing.value}</CardContentTitle>
              <CardContentDescription>{trailing.label}</CardContentDescription>
            </CardContent>
          </CardTrailing>
        ) : null}
      </CardHeader>

      <div className="flex flex-col gap-16 px-24 py-16">
        <PnlFieldsGroup fields={fields} />
      </div>

      {footer !== undefined && (
        <CardFooter>
          <CardContentDescription>{footer}</CardContentDescription>
        </CardFooter>
      )}
    </Card>
  );
}
