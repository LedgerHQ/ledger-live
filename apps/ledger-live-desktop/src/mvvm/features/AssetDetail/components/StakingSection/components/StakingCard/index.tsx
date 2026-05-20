import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";

type StakingCardProps = Readonly<{
  cardType: "info" | "interactive";
  title: React.ReactNode;
  description: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  "data-testid"?: string;
}>;

export function StakingCard({
  cardType,
  title,
  description,
  trailing,
  onClick,
  className,
  "data-testid": dataTestId,
}: StakingCardProps) {
  return (
    <Card type={cardType} onClick={onClick} className={className} data-testid={dataTestId}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <CardContentDescription>{description}</CardContentDescription>
          </CardContent>
        </CardLeading>
        {trailing ? <CardTrailing>{trailing}</CardTrailing> : null}
      </CardHeader>
    </Card>
  );
}
