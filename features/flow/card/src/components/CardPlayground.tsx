import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardTrailing,
  CardFooter,
} from "@ledgerhq/lumen-ui-react";

export function CardPlayground() {
  return (
    <Card className="w-320" onClick={() => {}}>
      <CardHeader>
        <CardLeading>
          <CryptoIcon alt="Bitcoin" ledgerId="bitcoin" size={48} ticker="BTC" />
          <CardContent>
            <CardContentTitle>Interactive (default)</CardContentTitle>
            <CardContentDescription>Whole card is clickable</CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <CardContent>
            <CardContentTitle>BTC</CardContentTitle>
            <CardContentDescription>123.2 BTC</CardContentDescription>
          </CardContent>
        </CardTrailing>
      </CardHeader>
      <CardFooter>
        <CardContentDescription>3 assets on 2 networks</CardContentDescription>
      </CardFooter>
    </Card>
  );
}
