import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { PasswordIncorrectError } from "@ledgerhq/errors";
import { setEncryptionKey, isEncryptionKeyCorrect, hasBeenDecrypted } from "~/renderer/storage";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";
import { useHardReset } from "~/renderer/reset";
import { fetchAccounts } from "~/renderer/actions/accounts";
import { fetchTrustchain } from "~/renderer/actions/trustchain";
import { unlock } from "~/renderer/actions/application";
import { isLocked as isLockedSelector } from "~/renderer/reducers/application";
import Box from "~/renderer/components/Box";
import InputPassword from "~/renderer/components/InputPassword";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Button from "~/renderer/components/Button";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import IconArrowRight from "~/renderer/icons/ArrowRight";
import Logo from "~/renderer/icons/Logo";
import { fetchWallet } from "../actions/wallet";

export default function IsUnlocked({ children }: { children: React.ReactNode }): JSX.Element {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const hardReset = useHardReset();
  const [inputValue, setInputValue] = useState<InputValue>({
    password: "",
  });
  const [incorrectPassword, setIncorrectPassword] = useState<MaybeError>(null);
  const [isHardResetting, setIsHardResetting] = useState(false);
  const [isHardResetModalOpened, setIsHardResetModalOpened] = useState(false);
  const isLocked = useSelector(isLockedSelector);
  const [submitting, setSubmitting] = useState(false);
  const handleChangeInput = useCallback(
    (key: keyof InputValue) => (value: InputValue[keyof InputValue]) => {
      if (submitting) return;
      setInputValue({
        ...inputValue,
        [key]: value,
      });
      setIncorrectPassword(null);
    },
    [inputValue, submitting],
  );
  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      try {
        const isAccountDecrypted = await hasBeenDecrypted();
        if (!isAccountDecrypted) {
          await setEncryptionKey(inputValue.password);
          await dispatch(fetchAccounts());
          await dispatch(fetchTrustchain());
          await dispatch(fetchWallet());
        } else if (!(await isEncryptionKeyCorrect(inputValue.password))) {
          throw new PasswordIncorrectError();
        }
        dispatch(unlock());
      } catch (error) {
        setIncorrectPassword(new PasswordIncorrectError());
      } finally {
        setInputValue({
          password: "",
        });
        setSubmitting(false);
      }
    },
    [inputValue, dispatch, submitting],
  );
  const handleOpenHardResetModal = useCallback(
    () => setIsHardResetModalOpened(true),
    [setIsHardResetModalOpened],
  );
  const handleCloseHardResetModal = useCallback(
    () => setIsHardResetModalOpened(false),
    [setIsHardResetModalOpened],
  );
  const handleHardReset = useCallback(async () => {
    setIsHardResetting(true);
    try {
      await hardReset();
      window.api?.reloadRenderer();
    } catch (error) {
      setIsHardResetting(false);
    }
  }, [hardReset]);
  useEffect(() => {
    let subscribed = false;
    const onKeyDown = () => {
      const input = document.getElementById("lockscreen-password-input");
      if (input) {
        input.focus();
      }
    };
    if (isLocked) {
      subscribed = true;
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      if (subscribed) {
        window.removeEventListener("keydown", onKeyDown);
      }
    };
  }, [isLocked]);
  if (isLocked) {
    return (
      <Box sticky alignItems="center" justifyContent="center" data-testid="lockscreen-container">
        <form onSubmit={handleSubmit}>
          <Box alignItems="center">
            <LedgerLiveLogo
              style={{
                marginBottom: 40,
              }}
              icon={<Logo size={50} />}
            />
            <PageTitle>{t("common.lockScreen.title")}</PageTitle>
            <LockScreenDesc>{t("common.lockScreen.description")}</LockScreenDesc>
            <Box horizontal alignItems="flex-start">
              <Box
                style={{
                  width: 280,
                }}
              >
                <InputPassword
                  autoFocus
                  disabled={submitting}
                  placeholder={t("common.lockScreen.inputPlaceholder")}
                  type="password"
                  onChange={handleChangeInput("password")}
                  value={inputValue.password}
                  error={incorrectPassword}
                  id="lockscreen-password-input"
                  data-testid="lockscreen-password-input"
                />
              </Box>
              <Box ml={2}>
                <Button
                  onClick={handleSubmit}
                  primary
                  flow={1}
                  style={{
                    width: 46,
                    height: 46,
                    padding: 0,
                    justifyContent: "center",
                  }}
                  data-testid="lockscreen-login-button"
                >
                  <Box alignItems="center">
                    <IconArrowRight size={20} />
                  </Box>
                </Button>
              </Box>
            </Box>
            <Button
              type="button"
              mt={3}
              small
              onClick={handleOpenHardResetModal}
              data-testid="lockscreen-forgotten-button"
            >
              {t("common.lockScreen.lostPassword")}
            </Button>
          </Box>
        </form>
        <ConfirmModal
          analyticsName="HardReset"
          isDanger
          centered
          isLoading={isHardResetting}
          isOpened={isHardResetModalOpened}
          onClose={handleCloseHardResetModal}
          onReject={handleCloseHardResetModal}
          onConfirm={handleHardReset}
          confirmText={t("common.reset")}
          title={t("settings.hardResetModal.title")}
          desc={t("settings.hardResetModal.desc")}
          renderIcon={HardResetIcon}
        />
      </Box>
    );
  }
  return <>{children}</>;
}
type InputValue = {
  password: string;
};
type MaybeError = Error | undefined | null;
export const PageTitle = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 7,
  color: "palette.text.shade100",
}))``;
export const LockScreenDesc = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 4,
  textAlign: "center",
  color: "palette.text.shade80",
}))`
  margin: 10px auto 25px;
`;
const IconWrapperCircle = styled(Box)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ea2e4919;
  align-items: center;
  justify-content: center;
`;
const HardResetIcon = () => (
  <IconWrapperCircle color="alertRed">
    <IconTriangleWarning width={23} height={21} />
  </IconWrapperCircle>
);
