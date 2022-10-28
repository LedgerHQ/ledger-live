import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Text } from "@ledgerhq/react-ui";

import Illustration from "~/renderer/components/Illustration";
import { Bullet, Status, StepText } from "./shared";
import Coins from "./assets/coins.png";

export type Props = {
  onComplete: () => void;
  productName: string;
};

type InstallingApplicationContentProps = {
  productName: string;
};

const InstallingApplicationContent = ({ productName }: InstallingApplicationContentProps) => {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" rowGap="24px">
      <Text variant="h5Inter">{"Installing apps 22%"}</Text>
      <Flex flexDirection="column">
        <Bullet bulletText="1" status={Status.completed} text={"Bitcoin"} />
        <Bullet bulletText="2" status={Status.active} text={"Ethereum"} />
        <Bullet bulletText="3" status={Status.inactive} text={"Polygon"} />
      </Flex>
      <StepText>
        {t("syncOnboarding.manual.installApplications.info", {
          deviceName: productName,
        })}
      </StepText>
    </Flex>
  );
};

const ApplicationContent = ({ onComplete, productName }: Props) => {
  const { t } = useTranslation();

  const [isInstallingApplications, setIsInstallingApplications] = useState<boolean>(false);

  if (isInstallingApplications) {
    // TODO: remove when we do the real app step content
    setTimeout(onComplete, 5000);
    return <InstallingApplicationContent productName={productName} />;
  }

  return (
    <Flex flexDirection="column" alignItems="center" rowGap="24px">
      <Illustration lightSource={Coins} darkSource={Coins} size={106} height={40} />
      <Text variant="h5Inter">{"Nano uses apps to enable secure blockchain transactions"}</Text>
      <StepText>{t("syncOnboarding.manual.installApplications.title")}</StepText>
      <Flex flex="1" justifyContent="space-around" width="100%">
        <Button
          variant="main"
          width="45%"
          padding="10px 20px"
          onClick={() => setIsInstallingApplications(true)}
        >
          {t("syncOnboarding.manual.installApplications.install")}
        </Button>
        <Button variant="main" outline width="45%" padding="10px 20px" onClick={onComplete}>
          {t("syncOnboarding.manual.installApplications.skip")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default ApplicationContent;
