import React, { useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import TabSelector from "LLM/features/WalletSync/components/Synchronize/TabSelector";
import QrCode from "LLM/features/WalletSync/components/Synchronize/QrCode";
import { Options, OptionsType } from "LLM/features/WalletSync/types/Activation";

const QrCodeMethod = () => {
  const [selectedOption, setSelectedOption] = useState<OptionsType>(Options.SCAN);

  const handleSelectOption = (option: OptionsType) => {
    setSelectedOption(option);
  };

  const renderSwitch = () => {
    switch (selectedOption) {
      case Options.SCAN:
        return (
          <Flex
            flexDirection={"column"}
            rowGap={24}
            alignItems={"center"}
            width={100}
            height={100}
            bg={"red"}
          />
        );
      case Options.SHOW_QR:
        return <QrCode qrCodeValue="ledger.com" />;
    }
  };

  return (
    <Flex flexDirection={"column"} alignItems={"center"} rowGap={24} pt={16} width={"100%"}>
      <TabSelector selectedOption={selectedOption} handleSelectOption={handleSelectOption} />
      {renderSwitch()}
    </Flex>
  );
};

export default QrCodeMethod;
