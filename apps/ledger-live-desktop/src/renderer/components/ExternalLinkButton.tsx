import React from "react";
import { openURL } from "~/renderer/linking";
import Button, { Props as ButtonProps } from "~/renderer/components/Button";
export function ExternalLinkButton({
  label,
  url,
  ...props
}: {
  label: React.ReactNode;
  url: string;
} & ButtonProps) {
  return (
    <Button onClick={() => openURL(url)} {...props}>
      {label}
    </Button>
  );
}
export default ExternalLinkButton;
