import React, { memo, useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import {
  Flex,
  Text,
  Icons,
  BottomDrawer,
  Button,
  Icon,
} from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

export const Badge = styled(Flex).attrs({
  bg: "neutral.c30",
  flexDirection: "row",
  mx: 2,
  px: 4,
  py: 1,
  justifyContent: " center",
  alignItems: "center",
  height: 32,
})`
  border-radius: 32px;
`;

const CheckIconContainer = styled(Flex).attrs({
  bg: "primary.c80",
  flexDirection: "row",
  justifyContent: " center",
  alignItems: "center",
  height: 24,
  width: 24,
})`
  border-radius: 24px;
`;

type Option = {
  label: string;
  value: any;
  requestParam: any;
};

type Props = {
  label: string;
  valueLabel: string;
  value: any;
  type?: "sort" | "filter";
  options: Option[];
  disabled?: boolean;
  onChange: (value: any) => void;
};

function SortBadge({
  label,
  valueLabel,
  value,
  type = "filter",
  options,
  disabled,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <>
      <TouchableOpacity onPress={openDrawer}>
        <Badge>
          <Text mr={2} fontWeight="semiBold" variant="body">
            {label}
          </Text>
          <Text fontWeight="semiBold" variant="body" color="primary.c100">
            {valueLabel}
          </Text>
          {type === "sort" ? (
            value === "asc" ? (
              <Icons.ArrowTopMedium size={12} color="primary.c100" />
            ) : value === "desc" ? (
              <Icons.ArrowBottomMedium size={12} color="primary.c100" />
            ) : null
          ) : null}
        </Badge>
      </TouchableOpacity>
      <BottomDrawer isOpen={isDrawerOpen} onClose={closeDrawer} title={label}>
        {options.map(
          ({ label, value: optValue, requestParam }: Option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onChange(requestParam)}
            >
              <Flex
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                height="48px"
                my={2}
              >
                <Text
                  variant="body"
                  fontWeight="semiBold"
                  color={value === optValue ? "primary.c80" : "neutral.c100"}
                >
                  {label}
                </Text>
                {value === optValue ? (
                  <CheckIconContainer>
                    <Icon name="CheckAlone" size={12} color="background.main" />
                  </CheckIconContainer>
                ) : null}
              </Flex>
            </TouchableOpacity>
          ),
        )}
        <Button mt={32} onPress={closeDrawer} type="main" size="large">
          {t(`market.filters.apply`)}
        </Button>
      </BottomDrawer>
    </>
  );
}

export default memo<Props>(SortBadge);
