import React from "react";
import { openURL } from "~/renderer/linking";
import Button from "~/renderer/components/Button";
import { Props as ButtonProps } from "~/renderer/components/Button";
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
