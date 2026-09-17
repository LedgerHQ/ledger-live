import React, { useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import type { CardNumbersUnlockDialogState } from "./useUnlockForCardNumbers";

export function CardNumbersUnlockDialog(props: CardNumbersUnlockDialogState) {
  if (props.phase === "closed") {
    return null;
  }

  return <CardNumbersUnlockForm {...props} />;
}

function CardNumbersUnlockForm({
  phase,
  mode,
  error,
  onSubmit,
  onCancel,
}: CardNumbersUnlockDialogState) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const isCreate = mode === "create";
  const busy = phase === "submitting";

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open && !busy) onCancel();
      }}
    >
      <DialogContent aria-describedby={isCreate ? "card-unlock-copy" : undefined}>
        <form
          onSubmit={event => {
            event.preventDefault();
            void Promise.resolve(onSubmit(password, confirmPassword)).then(() => {
              passwordInputRef.current?.focus();
            });
          }}
        >
          <DialogHeader
            density="expanded"
            title={
              isCreate ? t("password.setPassword.title") : t("payTab.card.numbers.unlockTitle")
            }
            onClose={busy ? undefined : onCancel}
          />
          <DialogBody className="flex flex-col gap-16">
            {isCreate ? (
              <p id="card-unlock-copy" className="body-3 text-muted">
                {t("password.setPassword.desc")}
              </p>
            ) : null}
            <TextInput
              ref={passwordInputRef}
              type="password"
              autoFocus
              hideClearButton
              disabled={busy}
              className={isCreate ? undefined : "mt-[2px]"}
              label={
                isCreate
                  ? t("password.inputFields.newPassword.label")
                  : t("password.inputFields.currentPassword.label")
              }
              value={password}
              onChange={event => setPassword(event.target.value)}
              helperText={error}
              status={error ? "error" : undefined}
            />
            {isCreate ? (
              <TextInput
                type="password"
                hideClearButton
                disabled={busy}
                label={t("password.inputFields.confirmPassword.label")}
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                status={error ? "error" : undefined}
              />
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button appearance="gray" type="button" disabled={busy} onClick={onCancel}>
              {t("common.cancel")}
            </Button>
            <Button appearance="base" type="submit" disabled={busy}>
              {isCreate ? t("common.save") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
