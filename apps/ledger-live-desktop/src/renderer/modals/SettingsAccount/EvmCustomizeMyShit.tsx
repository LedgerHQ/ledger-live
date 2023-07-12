import React, { memo, useEffect, useMemo, useState } from "react";
import isEqual from "lodash/isEqual";
import { Box } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/types-live";
import Select from "~/renderer/components/Select";
import { Container, OptionRowDesc, OptionRowTitle } from "./AccountSettingRenderBody";
import { CryptoCurrencyId, LedgerExplorerId } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfig } from "@ledgerhq/coin-evm/logic";
import Input from "~/renderer/components/Input";

const LEDGER_EXPLORERS_COMPAT: Partial<Record<CryptoCurrencyId, LedgerExplorerId>> = {
  ethereum_as_evm_test_only: "eth",
  polygon_as_evm_test_only: "matic",
};
const LEDGER_COMPATIBLE_CURRENCIES = Object.keys(LEDGER_EXPLORERS_COMPAT);

const NODE_OPTIONS = [
  { value: "ledger", label: "Ledger" },
  { value: "external", label: "External" },
] as const;

const EXPLORER_OPTIONS = [
  { value: "ledger", label: "Ledger" },
  { value: "etherscan", label: "Etherscan" },
  { value: "blockscout", label: "Blockscout" },
  { value: null, label: "None" },
] as const;

const GAS_TRACKER_OPTIONS = [
  { value: "ledger", label: "Ledger" },
  { value: null, label: "None" },
] as const;

type Props = {
  account: Account;
  onConfigChange: (config: Record<string, unknown>) => void;
};

const EvmCustomizeMyShit = ({ account, onConfigChange }: Props) => {
  const { currency } = account;

  const [config, setConfig] = useState<Partial<Awaited<ReturnType<typeof getCurrencyConfig>>>>({});
  useEffect(() => {
    getCurrencyConfig(currency).then(config => {
      setConfig(config);

      if (config.node) {
        setNodeOption(config.node.type);
        if (config.node.type !== "ledger") {
          setNodeUri(config.node.uri);
        }
      }

      if (config.explorer) {
        setExplorerOption(config.explorer.type);
        if (config.explorer.type !== "ledger") {
          setExplorerUri(config.explorer.uri);
        }
      }

      if (config.gasTracker) {
        setGasTrackerOption(config.gasTracker.type);
      }
    });
  }, [currency]);

  const nodeOptions = useMemo(
    () =>
      NODE_OPTIONS.filter(option => {
        if (option.value === "ledger") {
          return LEDGER_COMPATIBLE_CURRENCIES.includes(currency.id);
        }
        return true;
      }),
    [currency],
  );
  const [nodeOption, setNodeOption] = useState<"ledger" | "external" | null>(
    config?.node?.type || null,
  );
  const [nodeUri, setNodeUri] = useState(
    (config?.node?.type === "external" && config?.node?.uri) || "",
  );

  const explorerOptions = useMemo(
    () =>
      EXPLORER_OPTIONS.filter(option => {
        if (option.value === "ledger") {
          return LEDGER_COMPATIBLE_CURRENCIES.includes(currency.id);
        }
        return true;
      }),
    [currency],
  );
  const [explorerOption, setExplorerOption] = useState<
    "ledger" | "etherscan" | "blockscout" | null
  >(config?.explorer?.type || null);
  const [explorerUri, setExplorerUri] = useState(
    (config?.explorer?.type !== "ledger" && config?.explorer?.uri) || "",
  );

  const gasTrackerOptions = useMemo(
    () =>
      GAS_TRACKER_OPTIONS.filter(option => {
        if (option.value === "ledger") {
          return LEDGER_COMPATIBLE_CURRENCIES.includes(currency.id);
        }
        return true;
      }),
    [currency],
  );
  const [gasTrackerOption, setGasTrackerOption] = useState<"ledger" | null>(
    config?.gasTracker?.type || null,
  );

  useEffect(() => {
    if (!config) return;

    const nodeConfig = (() => {
      if (nodeOption === "ledger") {
        return {
          type: nodeOption,
          explorerId: LEDGER_EXPLORERS_COMPAT[currency.id as CryptoCurrencyId],
        };
      }

      if (nodeOption === "external") {
        return nodeUri
          ? {
              type: nodeOption,
              uri: nodeUri,
            }
          : undefined;
      }

      return {};
    })();

    const explorerConfig = (() => {
      if (explorerOption === "ledger") {
        return {
          type: explorerOption,
          explorerId: LEDGER_EXPLORERS_COMPAT[currency.id as CryptoCurrencyId],
        };
      }

      if (explorerOption) {
        return explorerUri
          ? {
              type: explorerOption,
              uri: explorerUri,
            }
          : undefined;
      }

      return {};
    })();

    const gasTrackerConfig = (() => {
      if (gasTrackerOption === "ledger") {
        return {
          type: gasTrackerOption,
          explorerId: LEDGER_EXPLORERS_COMPAT[currency.id as CryptoCurrencyId],
        };
      }

      return {};
    })();

    onConfigChange({
      ...(!nodeConfig || isEqual(currency?.ethereumLikeInfo?.node, nodeConfig)
        ? {}
        : { node: nodeConfig }),
      ...(!explorerConfig || isEqual(currency?.ethereumLikeInfo?.explorer, explorerConfig)
        ? {}
        : { explorer: explorerConfig }),
      ...(!gasTrackerConfig || isEqual(currency?.ethereumLikeInfo?.gasTracker, gasTrackerConfig)
        ? {}
        : { gasTracker: gasTrackerConfig }),
    });
  }, [
    nodeOption,
    explorerOption,
    gasTrackerOption,
    currency.id,
    nodeUri,
    explorerUri,
    onConfigChange,
    config,
    currency,
  ]);

  return (
    <>
      <Container>
        <Box>
          <OptionRowTitle>Infrastructure</OptionRowTitle>
          <OptionRowDesc>
            <>
              {"BuUt WHo CaREs ABoUt PrIvaCY DUuH"}
              <Box style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
                <img src="https://cdn3.emoji.gg/emojis/9721_spongemock.gif" width={50} />
                <img
                  src="https://cdn3.emoji.gg/emojis/9721_spongemock.gif"
                  width={50}
                  style={{ transform: "scaleX(-100%)" }}
                />
                <img src="https://cdn3.emoji.gg/emojis/9721_spongemock.gif" width={50} />
                <img
                  src="https://cdn3.emoji.gg/emojis/9721_spongemock.gif"
                  width={50}
                  style={{ transform: "scaleX(-100%)" }}
                />
              </Box>
            </>
          </OptionRowDesc>
        </Box>
        <Box
          style={{
            width: 230,
          }}
        >
          <Box mb={20}>
            <Box>
              <OptionRowDesc>Pick node</OptionRowDesc>
            </Box>
            <Box>
              <Select
                isSearchable={false}
                isDisabled={nodeOptions.length <= 1}
                onChange={selected => setNodeOption(selected?.value || null)}
                renderValue={({ data }) => (
                  <Box>{`${data.label}${
                    data.value === currency.ethereumLikeInfo?.node?.type ? " (Default)" : ""
                  }`}</Box>
                )}
                renderOption={({ data }) => (
                  <Box>{`${data.label}${
                    data.value === currency.ethereumLikeInfo?.node?.type ? " (Default)" : ""
                  }`}</Box>
                )}
                value={{
                  value: nodeOption,
                  label: nodeOption
                    ? `${nodeOption?.slice(0, 1).toUpperCase()}${nodeOption?.slice(1)}`
                    : "None",
                }}
                options={nodeOptions}
              />
            </Box>
            {nodeOption && nodeOption !== "ledger" ? (
              <Box mt={10}>
                <Input value={nodeUri} onChange={setNodeUri} placeholder="Node URI" />
              </Box>
            ) : null}
          </Box>
          <Box mb={20}>
            <Box>
              <OptionRowDesc>Pick Explorer</OptionRowDesc>
            </Box>
            <Box>
              <Select
                isSearchable={false}
                isDisabled={explorerOptions.length <= 1}
                onChange={selected => setExplorerOption(selected?.value || null)}
                renderValue={({ data }) => (
                  <Box>{`${data.label}${
                    data.value === currency.ethereumLikeInfo?.explorer?.type ? " (Default)" : ""
                  }`}</Box>
                )}
                renderOption={({ data }) => (
                  <Box>{`${data.label}${
                    data.value === currency.ethereumLikeInfo?.explorer?.type ? " (Default)" : ""
                  }`}</Box>
                )}
                value={{
                  value: explorerOption,
                  label: explorerOption
                    ? `${explorerOption?.slice(0, 1).toUpperCase()}${explorerOption?.slice(1)}`
                    : "None",
                }}
                options={explorerOptions}
              />
            </Box>
            {explorerOption && explorerOption !== "ledger" ? (
              <Box mt={10}>
                <Input value={explorerUri} onChange={setExplorerUri} placeholder="Explorer URI" />
              </Box>
            ) : null}
          </Box>
          <Box>
            <Box>
              <OptionRowDesc>Pick Gas Tracker</OptionRowDesc>
            </Box>
            <Box>
              <Select
                isSearchable={false}
                isDisabled={gasTrackerOptions.length <= 1}
                onChange={selected => setGasTrackerOption(selected?.value || null)}
                renderValue={({ data }) => (
                  <Box>{`${data.label}${
                    data.value === currency.ethereumLikeInfo?.gasTracker?.type ? " (Default)" : ""
                  }`}</Box>
                )}
                renderOption={({ data }) => (
                  <Box>{`${data.label}${
                    data.value === currency.ethereumLikeInfo?.gasTracker?.type ? " (Default)" : ""
                  }`}</Box>
                )}
                value={{
                  value: gasTrackerOption,
                  label: gasTrackerOption
                    ? `${gasTrackerOption?.slice(0, 1).toUpperCase()}${gasTrackerOption?.slice(1)}`
                    : "None",
                }}
                options={gasTrackerOptions}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default memo(EvmCustomizeMyShit);
