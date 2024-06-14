import React, { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Flex, Icons, Link, Text, NumberedList } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import { useLiveAuthenticate, useTrustchainSdk } from "../../useTrustchainSdk";
import { createQRCodeHostInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import QRCode from "~/renderer/components/QRCode";
import { useDispatch } from "react-redux";
import { setFlow, setQrCodePinCode } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

type Props = {
  displayPinCode: () => void;
};
export default function SynchWithQRCodeStep({ displayPinCode }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { colors } = useTheme();

  const steps = [
    { element: t("walletSync.synchronize.qrCode.steps.step1") },
    {
      element: (
        <Text
          flex={1}
          ml="12px"
          fontSize={14}
          variant="body"
          fontWeight="500"
          color={rgba(colors.neutral.c100, 0.7)}
        >
          <Trans
            i18nKey="walletSync.synchronize.qrCode.steps.step2"
            t={t}
            components={[<Italic key={1} color={rgba(colors.neutral.c100, 0.7)} />]}
          />
        </Text>
      ),
    },
    { element: t("walletSync.synchronize.qrCode.steps.step3") },
  ];

  const sdk = useTrustchainSdk();

  const { trustchain, memberCredentials } = useLiveAuthenticate();

  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  console.log("SynchWithQRCodeStep", url);
  console.log("error", error);

  const goToActivation = useCallback(() => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  }, [dispatch]);

  const onStart = useCallback(() => {
    if (!trustchain || !memberCredentials) return;
    setError(null);
    createQRCodeHostInstance({
      onDisplayQRCode: url => {
        setUrl(url);
      },
      onDisplayDigits: digits => {
        dispatch(setQrCodePinCode(digits)); // Should we assert that it is a string of 3 digits ?
        displayPinCode();
      },
      addMember: async member => {
        const jwt = await sdk.auth(trustchain, memberCredentials);
        await sdk.addMember(jwt, trustchain, memberCredentials, member);
        return trustchain;
      },
    })
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          return;
        }
        setError(e);
      })
      .then(() => {
        setUrl(null);
        dispatch(setQrCodePinCode(null));
        dispatch(setFlow({ flow: Flow.Synchronize, step: Step.Synchronized }));
      });
  }, [trustchain, memberCredentials, dispatch, displayPinCode, sdk]);

  useEffect(() => {
    onStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex flexDirection="column" rowGap="24px" alignItems="center" flex={1}>
      <Text
        fontSize={23}
        variant="large"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        {t("walletSync.synchronize.qrCode.title")}
      </Text>
      <Flex
        flexDirection="column"
        flex={1}
        rowGap="40px"
        alignItems="center"
        justifyContent="center"
      >
        <QRContainer
          height={200}
          width={200}
          borderRadius={24}
          position="relative"
          bg="constant.white"
          alignItems="center"
          justifyContent="center"
        >
          <Flex
            alignItems="center"
            justifyContent="center"
            width={24}
            height={24}
            position="absolute"
          >
            {url && (
              <QRCodeContainer bg={"constant.white"} p={4}>
                <QRCode data={url} />
              </QRCodeContainer>
            )}

            {/* <Icons.LedgerLogo size="L" color="constant.black" /> */}
          </Flex>
        </QRContainer>

        <MiddleContainer
          rowGap="24px"
          flexDirection="column"
          p={"24px"}
          backgroundColor={colors.opacityDefault.c05}
        >
          <Text fontSize={16} variant="large" fontWeight="500" color="neutral.c100">
            {t("walletSync.synchronize.qrCode.description")}
          </Text>
          <NumberedList steps={steps} />
        </MiddleContainer>
        <Link color="neutral.c70" onClick={goToActivation}>
          <Text fontSize={14} variant="paragraph" fontWeight="semiBold" color="neutral.c70">
            {t("walletSync.synchronize.qrCode.hint")}
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
}

const MiddleContainer = styled(Flex)`
  border-radius: 12px;
`;

const QRContainer = styled(Flex)`
  border: 1px solid ${({ theme }) => theme.colors.opacityDefault.c10};
`;

const QRCodeContainer = styled(Flex)`
  border-radius: 24px;
`;

const Italic = styled(Text)`
  font-style: italic;
`;
