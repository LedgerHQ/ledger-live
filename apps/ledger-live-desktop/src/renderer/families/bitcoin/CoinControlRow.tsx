import React, { useState } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { getUTXOStatus } from "@ledgerhq/live-common/families/bitcoin/logic";
import { AccountBridge } from "@ledgerhq/types-live";
import Checkbox from "~/renderer/components/CheckBox";
import FormattedVal from "~/renderer/components/FormattedVal";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import {
  BitcoinAccount,
  BitcoinOutput,
  Transaction,
  TransactionStatus,
  UtxoStrategy,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { useNftGallery } from "~/newArch/Ordinals/hooks/useNftGallery";
import { Flex, Icons } from "@ledgerhq/react-ui";
import { SatributesComponent } from "~/newArch/Ordinals/components/RareSats/Sats";
import { Ordinal } from "~/newArch/Ordinals/types/Ordinals";
import Image from "~/renderer/components/Image";

type CoinControlRowProps = {
  utxo: BitcoinOutput;
  utxoStrategy: UtxoStrategy;
  status: TransactionStatus;
  account: BitcoinAccount;
  totalExcludedUTXOS: number;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  bridge: AccountBridge<Transaction>;
  disableOrdinals: boolean;
};
const Container = styled(Box).attrs<{
  disabled: boolean;
  withOrdinals: boolean;
  onClick: () => void;
}>(p => ({
  opacity: p.disabled ? 0.5 : 1,
  horizontal: true,
}))<{
  disabled: boolean;
  withOrdinals: boolean;
  onClick: () => void;
}>`
  padding: 15px;
  border-radius: 4px;
  border: 1px solid
    ${p =>
      p.withOrdinals ? p.theme.colors.palette.warning.c50 : p.theme.colors.palette.text.shade20};
  ${p =>
    p.disabled
      ? `
    background-color: ${p.theme.colors.palette.text.shade10};
    `
      : `
      cursor: pointer;
    `}

  &:hover {
    border-color: ${p =>
      p.disabled ? p.theme.colors.palette.text.shade20 : p.theme.colors.palette.primary.main};
  }

  display: flex;
  flex-direction: column;
`;
export const CoinControlRow = ({
  utxo,
  utxoStrategy,
  status,
  account,
  totalExcludedUTXOS,
  updateTransaction,
  bridge,
  disableOrdinals,
}: CoinControlRowProps) => {
  const s = getUTXOStatus(utxo, utxoStrategy);
  const utxoStatus = s.excluded ? s.reason || "" : "";
  const unconfirmed = utxoStatus === "pickPendingUtxo";
  const last = !s.excluded && totalExcludedUTXOS + 1 === account.bitcoinResources?.utxos.length; // make sure that at least one utxo is selected
  const disabled = unconfirmed || last;
  const [isDropdownOpen, setIsDropDownOpen] = useState<boolean>(false);
  const { nfts: allRareSats } = useNftGallery({
    addresses: utxo.address || "",
    standard: "raresats",
    threshold: 10,
  });
  const { nfts: allInscriptions } = useNftGallery({
    addresses: utxo.address || "",
    standard: "inscriptions",
    threshold: 10,
  });
  const onClick = () => {
    if (disabled) return;
    const patch = {
      utxoStrategy: {
        ...utxoStrategy,
        excludeUTXOs: !s.excluded
          ? utxoStrategy.excludeUTXOs.concat({
              hash: utxo.hash,
              outputIndex: utxo.outputIndex,
            })
          : utxoStrategy.excludeUTXOs.filter(
              e => e.hash !== utxo.hash || e.outputIndex !== utxo.outputIndex,
            ),
      },
    };
    updateTransaction((t: Transaction) => bridge.updateTransaction(t, patch));
  };

  const rare: Ordinal[] = allRareSats
    .filter((ordi: Ordinal) => ordi.contract_address.includes(utxo.hash))
    .filter((ordi: Ordinal) => {
      const satributes = ordi.metadata.utxo_details?.satributes;
      const keys = Object.keys(satributes || {});
      return keys[0] !== "common" || keys.length > 1;
    });

  console.log(allInscriptions);
  const inscr = allInscriptions.filter(
    (ordi: Ordinal) =>
      ordi.contract_address.includes(utxo.hash) ||
      ordi.metadata.ordinal_details?.location.includes(utxo.hash),
  );

  console.log(inscr);

  const withOrdinals = rare.length > 0 || inscr.length > 0;
  return (
    <Container
      disabled={unconfirmed || (disableOrdinals && withOrdinals)}
      onClick={() => withOrdinals && setIsDropDownOpen(!isDropdownOpen)}
      withOrdinals={withOrdinals}
    >
      <Flex flex={1} alignItems={"center"}>
        {unconfirmed ? (
          <Tooltip content={<Trans i18nKey={"bitcoin.cannotSelect.pending"} />}>
            <InfoCircle size={16} />
          </Tooltip>
        ) : last ? (
          <Tooltip content={<Trans i18nKey={"bitcoin.cannotSelect.last"} />}>
            <Checkbox isChecked disabled />
          </Tooltip>
        ) : (
          <Checkbox
            isChecked={!s.excluded && !(disableOrdinals && withOrdinals)}
            onChange={onClick}
            disabled={disableOrdinals && withOrdinals}
          />
        )}
        <Box
          style={{
            marginLeft: 15,
            flexBasis: "30%",
            flex: 1,
          }}
        >
          <FormattedVal
            disableRounding
            val={utxo.value}
            unit={account.unit}
            showCode
            fontSize={4}
            color="palette.text.shade100"
            ff="Inter|SemiBold"
          />
          {utxo.blockHeight ? (
            <Text ff="Inter|Medium" fontSize={3} color={"palette.text.shade50"}>
              {account.blockHeight - utxo.blockHeight + " confirmations"}
            </Text>
          ) : (
            <Text ff="Inter|Medium" fontSize={3} color={"alertRed"}>
              <Trans i18nKey="bitcoin.pending" />
            </Text>
          )}
        </Box>

        {withOrdinals ? (
          <Box>
            {isDropdownOpen ? <Icons.ChevronUp size="XS" /> : <Icons.ChevronDown size="XS" />}
          </Box>
        ) : null}
      </Flex>

      <Box
        style={{
          flex: 1,
          display: isDropdownOpen ? "block" : "none",
          marginTop: 20,
        }}
      >
        {/* <Text color="palette.text.shade100" ff="Inter|SemiBold" fontSize={4}>
          <SplitAddress value={utxo.address || ""} />
        </Text> */}

        {/* <Box horizontal justifyContent="flex-start" marginBottom={3}>
          <Text
            style={{
              whiteSpace: "nowrap",
            }}
            color="palette.text.shade50"
            ff="Inter|Medium"
            fontSize={3}
          >
            #{utxo.outputIndex} of
          </Text>
          <Cell
            grow
            shrink
            style={{
              display: "block",
              marginLeft: 4,
            }}
            px={0}
          >
            <Text
              style={{
                whiteSpace: "nowrap",
              }}
              color="palette.text.shade50"
              ff="Inter|Medium"
              fontSize={3}
            >
              <SplitAddress value={utxo.hash} />
            </Text>
          </Cell>
        </Box> */}

        {withOrdinals ? (
          <>
            <Flex marginBottom={2}>
              <Icons.Warning size="XS" color="palette.warning.c60" />
              <Text
                style={{
                  whiteSpace: "nowrap",
                }}
                color="palette.warning.c50"
                ff="Inter|Medium"
                fontSize={3}
                marginLeft={1}
              >
                Transferring this UTXO might result in the loss of the following assets:
              </Text>
            </Flex>

            {inscr.map((rare: Ordinal, i: number) => {
              const contentType = rare.metadata.ordinal_details?.content_type;
              const imageUrl =
                contentType && contentType?.includes("html")
                  ? `https://renderer.magiceden.dev/v2/render?id=${rare.metadata.ordinal_details?.inscription_id}`
                  : rare.metadata.image_original_url;

              return (
                <Flex key={"inscription-" + i}>
                  <Flex
                    width={50}
                    height={50}
                    borderRadius={4}
                    mr={2}
                    overflow="hidden"
                    alignItems="center"
                  >
                    <Image resource={imageUrl || ""} width={50} height={50} alt="" />
                  </Flex>

                  <Box>
                    <Text fontWeight={500} fontSize={14}>
                      {rare.contract.name}
                    </Text>
                    <Text fontWeight={400} fontSize={12} color="palette.text.shade50">
                      {rare.name ?? "-"}
                    </Text>
                  </Box>
                </Flex>
              );
            })}

            {rare.map((rare: Ordinal) => {
              return rare.metadata.utxo_details?.sat_ranges.map((element, index) => (
                <SatributesComponent
                  keySats={element.subranges[0]?.sat_types || []}
                  nbSats={element.value}
                  year={rare.metadata.utxo_details?.sat_ranges[0]?.year}
                  key={index}
                />
              ));
            })}
          </>
        ) : (
          <></>
        )}
      </Box>
    </Container>
  );
};
