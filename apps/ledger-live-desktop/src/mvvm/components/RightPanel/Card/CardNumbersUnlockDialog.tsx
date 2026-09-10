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
  if (!props.isOpen) {
    return null;
  }

  return <CardNumbersUnlockForm {...props} />;
}

function CardNumbersUnlockForm({
  mode,
  error,
  isSubmitting,
  isBusy,
  onSubmit,
  onCancel,
}: CardNumbersUnlockDialogState) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open && !isBusy) onCancel();
      }}
    >
      <DialogContent data-testid="card-numbers-unlock-dialog">
        <form
          onSubmit={event => {
            event.preventDefault();
            void Promise.resolve(onSubmit(password, confirmPassword)).then(() => {
              passwordInputRef.current?.focus();
            });
          }}
        >
          {mode === "create" ? (
            <>
              <DialogHeader
                density="expanded"
                title={t("password.setPassword.title")}
                onClose={isBusy ? undefined : onCancel}
              />
              <DialogBody className="flex flex-col gap-16">
                <p className="body-3 text-muted">{t("password.setPassword.desc")}</p>
                <TextInput
                  ref={passwordInputRef}
                  type="password"
                  autoFocus
                  hideClearButton
                  label={t("password.inputFields.newPassword.label")}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  helperText={error}
                  status={error ? "error" : undefined}
                />
                <TextInput
                  type="password"
                  hideClearButton
                  label={t("password.inputFields.confirmPassword.label")}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                />
              </DialogBody>
              <DialogFooter>
                <Button appearance="gray" type="button" disabled={isBusy} onClick={onCancel}>
                  {t("common.cancel")}
                </Button>
                <Button appearance="base" type="submit" loading={isSubmitting}>
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </>
          ) : null}

          {mode === "verify" ? (
            <>
              <DialogHeader
                density="expanded"
                title={t("payTab.card.numbers.unlockTitle")}
                onClose={isBusy ? undefined : onCancel}
              />
              <DialogBody className="flex flex-col gap-16">
                <TextInput
                  ref={passwordInputRef}
                  type="password"
                  autoFocus
                  hideClearButton
                  className="mt-[2px]"
                  label={t("password.inputFields.currentPassword.label")}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  helperText={error}
                  status={error ? "error" : undefined}
                />
              </DialogBody>
              <DialogFooter>
                <Button appearance="gray" type="button" disabled={isBusy} onClick={onCancel}>
                  {t("common.cancel")}
                </Button>
                <Button appearance="base" type="submit" loading={isSubmitting}>
                  {t("common.confirm")}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
