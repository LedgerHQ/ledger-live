import React, { useCallback, useRef } from "react";
import { PasswordsDontMatchError } from "@ledgerhq/errors";
import { TFunction } from "i18next";
import Box from "~/renderer/components/Box";
import InputPassword from "~/renderer/components/InputPassword";
import Label from "~/renderer/components/Label";

type Props = {
  t: TFunction;
  hasPassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  incorrectPassword?: Error | null;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  isValid: () => boolean;
  onChange: (key: string) => (value: string) => void;
};

const PasswordForm = ({
  t,
  hasPassword,
  currentPassword,
  newPassword,
  incorrectPassword,
  confirmPassword,
  isValid,
  onChange,
  onSubmit,
}: Props) => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Programmatically submit the form, which will trigger onSubmit naturally
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  }, []);

  // TODO: adjust design to separate 3 fields
  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <Box px={7} mt={4} flow={3}>
        {hasPassword && (
          <Box flow={1} mb={5}>
            <Label htmlFor="currentPassword">
              {t("password.inputFields.currentPassword.label")}
            </Label>
            <InputPassword
              autoFocus
              data-testid="current-password-input"
              onChange={onChange("currentPassword")}
              value={currentPassword}
              error={incorrectPassword}
            />
          </Box>
        )}
        <Box flow={1}>
          <Label htmlFor="newPassword">{t("password.inputFields.newPassword.label")}</Label>
          <InputPassword
            style={{
              marginTop: 4,
              width: 240,
            }}
            autoFocus={!hasPassword}
            data-testid="new-password-input"
            onChange={onChange("newPassword")}
            value={newPassword}
          />
        </Box>
        <Box flow={1}>
          <Label htmlFor="confirm-password-input">
            {t("password.inputFields.confirmPassword.label")}
          </Label>
          <InputPassword
            style={{
              width: 240,
            }}
            onEnter={handleEnter}
            data-testid="confirm-password-input"
            onChange={onChange("confirmPassword")}
            value={confirmPassword}
            error={!isValid() && confirmPassword.length > 0 && new PasswordsDontMatchError()}
          />
        </Box>
        <button hidden type="submit" aria-label={t("common.submit")} />
      </Box>
    </form>
  );
};

export default PasswordForm;
