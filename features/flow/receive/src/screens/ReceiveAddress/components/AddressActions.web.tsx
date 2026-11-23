import React, { type ReactNode } from "react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TileButton,
} from "@ledgerhq/lumen-ui-react";
import { Check, Copy, ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";
import type { AddressActionsProps } from "./AddressActions.types";

type VerifyHint = NonNullable<AddressActionsProps["actions"]["verifyHint"]>;

function VerifyHintPopover({
  hint,
  children,
}: Readonly<{ hint: VerifyHint; children: ReactNode }>) {
  return (
    <Popover open onOpenChange={() => undefined}>
      <PopoverTrigger render={<div className="relative z-menu flex-1">{children}</div>} />
      {/* The dialog sets pointer-events: none on the body. */}
      <PopoverContent side="top" align="end" className="pointer-events-auto max-w-256">
        <div className="flex flex-col gap-12" data-testid="receive-address-verify-hint">
          <p className="body-2 whitespace-pre-line text-base">{hint.message}</p>
          <Button size="sm" className="self-end" onClick={hint.onGotIt}>
            {hint.gotItLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function VerifyAction({
  verify,
  verifyHint,
  disabled,
}: Readonly<{
  verify: AddressActionsProps["actions"]["verify"];
  verifyHint: VerifyHint | undefined;
  disabled: boolean;
}>) {
  if (!verify) return null;
  const tile = (
    <TileButton
      icon={ShieldCheck}
      isFull
      disabled={disabled || verify.disabled}
      onClick={verify.onPress}
      data-testid="receive-address-verify"
    >
      {verify.label}
    </TileButton>
  );
  return verifyHint ? (
    <VerifyHintPopover hint={verifyHint}>{tile}</VerifyHintPopover>
  ) : (
    <div className="flex-1">{tile}</div>
  );
}

/** Copy and Verify tiles side by side; the verify hint points at Verify. */
export function AddressActions({ actions }: AddressActionsProps) {
  const { disabled, copy, verify, verifyHint } = actions;

  return (
    <div className="flex w-full flex-row gap-8">
      {copy ? (
        <div className="flex-1">
          <TileButton
            icon={copy.hasCopied ? Check : Copy}
            isFull
            disabled={disabled}
            onClick={copy.onPress}
            data-testid="receive-address-copy"
          >
            {copy.label}
          </TileButton>
        </div>
      ) : null}
      <VerifyAction verify={verify} verifyHint={verifyHint} disabled={disabled} />
    </div>
  );
}
