import React from "react";
import { Text } from "@ledgerhq/react-ui/index";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

type Props = {
  translationKey: string;
  count?: number;
};

export const Title = ({ translationKey, count }: Props) => {
  const { t } = useTranslation();

  return (
    <Text
      display="block"
      flexDirection="row"
      alignItems="center"
      justifyContent="flex-start"
      columnGap={1}
      fontSize={24}
      fontWeight="semiBold"
      color="palette.text.shade100"
      data-testid="select-asset-drawer-title"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={translationKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          data-testid="select-asset-drawer-title-dynamic"
        >
          {t(translationKey, { count })}
        </motion.span>
      </AnimatePresence>
    </Text>
  );
};
