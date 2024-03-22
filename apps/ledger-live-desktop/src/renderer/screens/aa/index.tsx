import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Flex, Grid, Icons, IconsLegacy, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";
import Box, { Card } from "~/renderer/components/Box";
import styled from "styled-components";
import { completeAuthenticate, zerodev, signer, chains } from "@ledgerhq/account-abstraction";
import EmptyStateAccounts from "../dashboard/EmptyStateAccountsAA";
import { buildAccount } from "~/renderer/modals/SmartAccountSignerModal/accountStructure";
import { useDispatch } from "react-redux";
import { addAccount } from "~/renderer/actions/accounts";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import { setDrawer } from "~/renderer/drawers/Provider";
import { openURL } from "~/renderer/linking";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ItemContainer } from "~/renderer/components/TopBar/shared";
import { useSelector } from "react-redux";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import IconCheck from "~/renderer/icons/Check";
import { colors } from "~/renderer/styles/theme";
import { getAccountCurrency, getAccountName } from "@ledgerhq/live-common/account/index";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { MintNftActionDefault } from "../account/AccountActionsDefault";
import OptionBox from "~/renderer/modals/SmartAccountPluginsModal/OptionBox";
import { setupCustomSigner } from "./setupCustomSigner";
import { SettingsSectionRow } from "../settings/SettingsSection";

const Container = styled(Flex).attrs({
  flex: "1",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  overflow: "hidden",
  px: 1,
  mx: -1,
})``;

const Title = styled(Text).attrs({ variant: "h3" })`
  font-size: 28px;
  line-height: 33px;
`;

const ItemContent = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
}))`
  font-size: 14px;
  line-height: 20px;
`;

async function completeAuth(orgId: string, bundle: string) {
  try {
    const { email, address } = await completeAuthenticate(orgId, bundle);
    console.log(`[completeAuthenticate] finsihed, mail = ${email} and address = ${address}`);
    return { email, address };
  } catch (err) {
    console.error(err);
  }
}

export default function AccountAbstraction({ location: { state } }) {
  const dispatch = useDispatch();
  const { pushToast, dismissToast } = useToasts();
  console.log({ signerFetched: state?.signer });
  const signerFromQueryParams = state?.signer;
  console.log({ signerFromQueryParams });
  const [address, setAddress] = useState("");
  const [saAddress, setSaAddress] = useState("");
  const [multisigSaAddress, setMultisigSaAddress] = useState("");
  const [mintTransactionHash, setMintTransactionHash] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [validUntil, setValidUntil] = useState(() => Date.now());
  const [account, setAccount] = useState<AccountLike | null>(null);
  const chain = useMemo(() => {
    if (!account || !account.currency) {
      return "ethereum_sepolia";
    }
    if (account.currency.id === "ethereum") {
      return "ethereum_sepolia";
    }
    if (account.currency.id === "optimism") {
      return "optimism_sepolia";
    }
    return account.currency.id;
  }, [account]);
  console.log({ chain });
  const chainData = chains[chain];
  const explorer = chainData.explorer; //chain === "ethereum_sepolia" ? "sepolia.etherscan.io" : "polygonscan.com";
  const explorerBis = `${chainData.blockScoutName}.blockscout.com`;
  // chain === "ethereum_sepolia" ? "eth-sepolia.blockscout.com" : "polygon.blockscout.com";
  const chainId = `${chainData.id}`;
  // const chainId = chain === "ethereum_sepolia" ? "11155111" : "137";

  const flattenedAccounts = useSelector(flattenAccountsSelector);
  console.log({ flattenedAccounts });

  const validUntilReadable = useMemo(() => {
    return new Date(validUntil).toLocaleTimeString();
  }, [validUntil]);

  useEffect(() => {
    if (!account) {
      console.log(`setting default account`);
      setAccount(flattenedAccounts[0]);
    }
  }, [flattenedAccounts]);

  const handleConnect = useCallback(
    async (email: string) => {
      console.log({ accountInConnect: account });
      const res = await zerodev.connect({
        chainName: chain,
      });
      console.log({ email, res });
      if (res && !!res.saAddress) {
        console.log({ res });
        setSaAddress(res.saAddress);
        const account = await buildAccount(res.saAddress, email, chain);
        console.log({ accountbuilt: account });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        dispatch(addAccount(account));
      }
    },
    [account, chain],
  );

  const fetchValidUntil = useCallback(() => {
    // get validuntil from signer session https://docs.turnkey.com/concepts/email-auth
    const alchemySignerSession = localStorage.getItem("alchemy-signer-session");
    if (alchemySignerSession) {
      const signerSession = JSON.parse(alchemySignerSession);
      setValidUntil(signerSession.expirationDateMs);
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      console.log("CHECK");
      if (!account) {
        setAccount(flattenedAccounts[0]);
        return;
      }
      if (!!signerFromQueryParams && signerFromQueryParams.orgId && signerFromQueryParams.bundle) {
        console.log(`will complete authentication for ${signerFromQueryParams.orgId}`);
        const res = await completeAuth(signerFromQueryParams.orgId, signerFromQueryParams.bundle);

        fetchValidUntil();
        console.log({ RESHERE: res });
        setAddress(res.address);
        setLoggedEmail(res.email || "");
        await handleConnect(res.email || "");
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        dispatch(addAccount(account));
      } else {
        const user = await signer.getAuthDetails().catch(() => null);
        if (user) {
          console.log("found a user in local storage, initializing client!");
          setAddress(user.address);
          setLoggedEmail(user.email || "");
          await handleConnect(user.email || "");
          fetchValidUntil()
        }
      }
    };
    check();
  }, [account, signerFromQueryParams, signerFromQueryParams?.orgId, signerFromQueryParams?.bundle]);

  const handleMint = async () => {
    const res = await zerodev.safeMint({
      chainName: chain,
      saAddress: multisigSaAddress ? multisigSaAddress : saAddress,
    });
    console.log({ resmint: res });
    if (res && !!res.transactionHash) {
      setMintTransactionHash(res.transactionHash);
    }
  };

  const mintNft = <MintNftActionDefault onClick={handleMint} />;

  const pickAccount = async () => {
    // const eth = getCryptoCurrencyById("ethereum");
    // const polygon = getCryptoCurrencyById("polygon");
    const chainsToDisplay = Object.values(chains).map(chain =>
      getCryptoCurrencyById(chain.cryptoCurrencyId),
    );

    setDrawer(
      SelectAccountAndCurrencyDrawer,
      {
        currencies: chainsToDisplay,
        onAccountSelected: (account: AccountLike, parentAccount: Account | undefined) => {
          setDrawer();
          setSaAddress("");
          setMultisigSaAddress("");
          setMintTransactionHash("");
          console.log({ account, parentAccount });
          setAccount(account);
          handleConnect(loggedEmail);
        },
      },
      {
        onRequestClose: () => {
          setDrawer();
        },
      },
    );
  };

  const handleAddLedgerSigner = async () => {
    if (!account) {
      console.warn("[handleAddLedgerSigner] returning early because no accounts");
      return;
    }
    const ledgerSigner = setupCustomSigner({ account, dispatch });
    console.log({ ledgerSigner });
    const res = await zerodev.addLedgerSigner({
      chainName: chain,
      saAddress,
      ledgerSigner,
    });
    console.log({ resAddLedgerSigner: res });
    if (res && res.newSaAddress) {
      setMultisigSaAddress(res.newSaAddress);
      // setSmartAccount(res.smartAccount);
      const account = await buildAccount(res.newSaAddress, loggedEmail, chain, true);
      console.log({ accountbuilt: account });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      dispatch(addAccount(account));
      dismissToast(`AA-${loggedEmail}`);
      pushToast({
        id: `${chainId}-${res.newSaAddress}`,
        title: "Account now secured by your ledger device",
        text: "You're now a self custody superstar 🎉",
        icon: "info",
      });
    }
  };

  return (
    <Container>
      {address ? (
        <Container>
          <Title>Smart Accounts</Title>
          {/*
          <Box marginY={30} flow={5}>
            <Box horizontal alignItems="center" justifyContent="space-between"></Box>
            <ItemContainer
              isInteractive
              onClick={() => {
                // signer.disconnect();
                // localStorage.removeItem("alchemy-signer-session:temporary");
                setAddress("");
                setLoggedEmail("");
              }}
            >
              <IconsLegacy.EyeNoneMedium size={18} />
            </ItemContainer>
          </Box>
            */}
          <Card marginBottom={20} mt={5} p={0} paddingTop={3} paddingBottom={5}>
            <Flex px={6} horizontal grow>
              <Flex flexGrow={1}>
                <SettingsSectionRow
                  title={`${loggedEmail}`}
                  desc={`session valid until ${validUntilReadable}`}
                ></SettingsSectionRow>
              </Flex>
              {account && (
                <ItemContainer flexGrow={1} marginTop={3} isInteractive onClick={pickAccount}>
                  <>
                    <CryptoCurrencyIcon circle currency={getAccountCurrency(account)} size={16} />
                    <ItemContent marginLeft={2}>{getAccountName(account)}</ItemContent>
                  </>
                </ItemContainer>
              )}
            </Flex>
            <Box px={6} marginTop={5}>
              <Flex>
                <Box width={20}>
                  {address && <IconCheck color={colors.positiveGreen} size={16} />}
                </Box>
                <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                  Email signer:{" "}
                  {address && (
                    <LabelWithExternalIcon
                      color="wallet"
                      ff="Inter|SemiBold"
                      onClick={() => {
                        openURL(`${explorer}/address/${address}`);
                      }}
                      label={address}
                    />
                  )}
                </Text>
              </Flex>

              <Flex>
                <Box width={20}>
                  {saAddress && <IconCheck color={colors.positiveGreen} size={16} />}
                </Box>
                <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                  Smart Account address:{" "}
                  {saAddress && (
                    <LabelWithExternalIcon
                      color="wallet"
                      ff="Inter|SemiBold"
                      onClick={() => {
                        openURL(`${explorer}/address/${saAddress}`);
                      }}
                      label={saAddress}
                    />
                  )}
                </Text>
              </Flex>

              <Flex>
                <Box width={20}>
                  {multisigSaAddress && <IconCheck color={colors.positiveGreen} size={16} />}
                </Box>
                <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                  Multisig Smart Account address:{" "}
                  {multisigSaAddress && (
                    <LabelWithExternalIcon
                      color="wallet"
                      ff="Inter|SemiBold"
                      onClick={() => {
                        openURL(`${explorer}/address/${multisigSaAddress}`);
                      }}
                      label={multisigSaAddress}
                    />
                  )}
                </Text>
              </Flex>

              <Flex>
                <Box width={20}>
                  {mintTransactionHash && <IconCheck color={colors.positiveGreen} size={16} />}
                </Box>
                <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                  Minted NFT tx hash:{" "}
                  {mintTransactionHash && (
                    <LabelWithExternalIcon
                      color="wallet"
                      ff="Inter|SemiBold"
                      onClick={() => {
                        openURL(`${explorer}/tx/${mintTransactionHash}`);
                      }}
                      label={mintTransactionHash}
                    />
                  )}
                </Text>
              </Flex>

              <Flex>
                <Box width={20}>
                  {multisigSaAddress && <IconCheck color={colors.positiveGreen} size={16} />}
                </Box>
                <Text color="palette.text.shade80" ff="Inter|SemiBold" fontSize={4}>
                  All user ops here:{" "}
                  {multisigSaAddress && (
                    <LabelWithExternalIcon
                      color="wallet"
                      ff="Inter|SemiBold"
                      onClick={() => {
                        openURL(
                          `https://${explorerBis}/address/${
                            multisigSaAddress ? multisigSaAddress : saAddress
                          }?tab=user_ops`,
                        );
                      }}
                      label={` Blockscout ${!chainData.blockScoutName ? "not available" : " "}`}
                    />
                  )}
                </Text>
              </Flex>

              <Flex marginTop={30} width={180}>
                {mintNft}
              </Flex>
            </Box>
          </Card>
          <Box>
            {!multisigSaAddress ? (
              <OptionBox
                title={"Secure your smart account with a ledger account"}
                description={
                  chainData.hasWeightedEcdsaValidator
                    ? "Requires signature with a ledger device to authorize a transaction"
                    : `${chainData.readableName} doesn't support this feature for now`
                }
                label={chainData.hasWeightedEcdsaValidator ? "new" : null}
                icon={Icons.LedgerDevices}
                onClick={handleAddLedgerSigner}
                setSelected={() => {}}
                disabled={!chainData.hasWeightedEcdsaValidator}
                isSelected={false}
              />
            ) : (
              <OptionBox
                title={"Account secured with your ledger device"}
                description={"Good job on securing your smart account"}
                icon={() => Icons.CheckmarkCircle({ color: "green" })}
                disabled={true}
                setSelected={() => {}}
                isSelected={false}
              />
            )}
          </Box>
          <Box mt={15}>
            <OptionBox
              title={"Email recovery"}
              description={"Setup another email as a recovery option for your account"}
              icon={() => Icons.At({})}
              label={"soon"}
              disabled={true}
              setSelected={() => {}}
              isSelected={false}
            />
          </Box>
          <Box mt={15}>
            <OptionBox
              title={"Multi Signature"}
              description={"Require multiple signatures to authorize a transaction"}
              icon={() => Icons.ShieldLock({})}
              label={"soon"}
              disabled={true}
              setSelected={() => {}}
              isSelected={false}
            />
          </Box>

          <Box mt={15}>
            <OptionBox
              title={"Dead Man Switch"}
              description={
                "Transfers the account keys to a another signer after a period of inactivity"
              }
              icon={() => Icons.Clock({})}
              label={"soon"}
              disabled={true}
              setSelected={() => {}}
              isSelected={false}
            />
          </Box>

          <Box mt={15}>
            <OptionBox
              title={"Dollar Cost Averaging"}
              description={"Automatically buy a fixed amount of crypto at regular intervals"}
              icon={() => Icons.DollarConvert({})}
              label={"soon"}
              disabled={true}
              setSelected={() => {}}
              isSelected={false}
            />
          </Box>
        </Container>
      ) : (
        <EmptyStateAccounts />
      )}
    </Container>
  );
}
