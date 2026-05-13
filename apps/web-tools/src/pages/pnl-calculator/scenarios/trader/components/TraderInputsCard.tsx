import type { ReactNode } from "react";
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
import { PnlCardIconStack } from "../../../shared/components/PnlCardIconStack";
import type { PnlCardIcon } from "../../../shared/components/types";

type TraderInputsCardProps = Readonly<{
  icons: PnlCardIcon[];
  title: ReactNode;
  description: ReactNode;
  opsCount: number;
  footer: ReactNode;
  children: ReactNode;
}>;

export function TraderInputsCard({
  icons,
  title,
  description,
  opsCount,
  footer,
  children,
}: TraderInputsCardProps) {
  return (
    <Card type="info" className="w-full min-w-0 flex-1 lg:max-w-480">
      <CardHeader>
        <CardLeading>
          <PnlCardIconStack icons={icons} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <CardContentDescription>{description}</CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <CardContent>
            <CardContentTitle>{opsCount}</CardContentTitle>
            <CardContentDescription>operations</CardContentDescription>
          </CardContent>
        </CardTrailing>
      </CardHeader>

      <div className="flex flex-col gap-16 px-24 py-16">{children}</div>

      <CardFooter>
        <CardContentDescription>{footer}</CardContentDescription>
      </CardFooter>
    </Card>
  );
}
