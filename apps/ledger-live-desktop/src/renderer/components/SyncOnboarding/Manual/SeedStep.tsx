import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
// import { StorylyInstanceID } from "@ledgerhq/types-live";

// import { StorylyWrapper } from "~/renderer/components/Storyly";
import { StepText } from "./shared";

export type SeedPathStatus =
  | "choice_new_or_restore"
  | "new_seed"
  | "choice_restore_direct_or_recover"
  | "restore_seed"
  | "recover_seed";

export type Props = {
  seedPathStatus: SeedPathStatus;
};

const SeedStep = ({ seedPathStatus }: Props) => {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column">
      <StepText mb={6}>
        {seedPathStatus === "new_seed"
          ? t("syncOnboarding.manual.seedContent.newSeed")
          : seedPathStatus === "choice_restore_direct_or_recover"
          ? t("syncOnboarding.manual.seedContent.choiceRestoreDirectOrRecover")
          : seedPathStatus === "restore_seed"
          ? t("syncOnboarding.manual.seedContent.restoreSeed")
          : seedPathStatus === "recover_seed"
          ? t("syncOnboarding.manual.seedContent.recoverSeed")
          : t("syncOnboarding.manual.seedContent.choiceNewOrRestore")}
      </StepText>
      {/* <StorylyWrapper instanceID={StorylyInstanceID.recoverySeed} /> */}
    </Flex>
  );
};

export default SeedStep;
