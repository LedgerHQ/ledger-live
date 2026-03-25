import React from "react";
import { useTranslation } from "react-i18next";
import { Divider } from "@ledgerhq/react-ui";
import { KNOWN_NEURON_IDS } from "@ledgerhq/live-common/families/internet_computer/consts";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Cross from "~/renderer/icons/Cross";

type FolloweesListProps = {
  followees: string[];
  onRemoveFollowee: (followee: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function FolloweesList({
  followees,
  onRemoveFollowee,
  onCancel,
  onSubmit,
}: FolloweesListProps) {
  const { t } = useTranslation();

  return (
    <>
      <Divider my={4} />
      <Box style={{ gap: 10 }}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          {t("internetComputer.common.followees")} ({followees.length})
        </Text>
        <Box style={{ gap: 10 }}>
          {followees.map(followee => (
            <Box style={{ gap: 10, flexDirection: "row" }} key={followee}>
              <Text ff="Inter|Regular" fontSize={14}>
                {KNOWN_NEURON_IDS[followee] ?? followee}
              </Text>
              <Box
                style={{ cursor: "pointer", margin: "auto 0" }}
                onClick={() => onRemoveFollowee(followee)}
              >
                <Cross size={12} />
              </Box>
            </Box>
          ))}
        </Box>
        <Box horizontal justifyContent="flex-end">
          <Button mr={2} onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSubmit} primary>
            {followees.length ? t("common.follow") : t("common.set")}
          </Button>
        </Box>
      </Box>
    </>
  );
}
