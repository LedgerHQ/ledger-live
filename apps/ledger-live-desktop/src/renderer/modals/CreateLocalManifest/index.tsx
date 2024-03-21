/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { useMemo, useState } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Flex } from "@ledgerhq/react-ui";
import {
  LiveAppManifest,
  LiveAppManifestSchema,
  LiveAppManifestDappSchema,
  LiveAppManifestDapp,
} from "@ledgerhq/live-common/platform/types";
import Text from "~/renderer/components/Text";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import Switch from "~/renderer/components/Switch";
import FormLiveAppInput from "./FormLiveAppInput";
import NestedFormCategory from "./NestedFormCategory";

const DEFAULT_FORM: LiveAppManifest = {
  id: "ReplaceAppName",
  author: "",
  private: false,
  name: "ReplaceAppName",
  url: "http://localhost:3000",
  homepageUrl: "http://localhost:3000/",
  supportUrl: "",
  icon: "",
  platforms: ["ios", "android", "desktop"],
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: ["NFT", "Swap", "YourAppCategory"],
  currencies: ["*"],
  highlight: false,
  content: {
    cta: { en: "" },
    subtitle: { en: "" },
    shortDescription: {
      en: "shortDescription",
    },
    description: {
      en: "description",
    },
  },
  domains: ["http://*"],
  visibility: "complete",
  permissions: [
    "account.list",
    "account.receive",
    "account.request",
    "currency.list",
    "device.close",
    "device.exchange",
    "device.transport",
    "message.sign",
    "transaction.sign",
    "transaction.signAndBroadcast",
    "wallet.capabilities",
    "wallet.info",
    "wallet.userId",
    "storage.get",
    "storage.set",
  ],
  dapp: {
    provider: "evm",
    nanoApp: "nanoApp",
    networks: [
      {
        currency: "ethereum",
        chainID: 1,
        nodeURL: "https://eth-dapps.api.live.ledger.com",
      },
    ],
  },
};

function createLocalManifest() {
  return (
    <Modal
      name="MODAL_CREATE_LOCAL_APP"
      centered
      render={({ data, onClose }) => <FormLocalManifest data={data} onClose={onClose} />}
    />
  );
}

function updateObjectAtPath(obj: LiveAppManifest, path: string, newValue: any): LiveAppManifest {
  const pathArray = path.split(".");
  let current = obj;

  for (let i = 0; i < pathArray.length - 1; i++) {
    if (current[pathArray[i]] === undefined) {
      console.error(`Path "${path}" does not exist in the object.`);
      return obj; // Return the original object and log an error
    }
    current[pathArray[i]] = Array.isArray(current[pathArray[i]])
      ? [...current[pathArray[i]]]
      : { ...current[pathArray[i]] }; // Create a shallow copy of the nested object or array
    current = current[pathArray[i]];
  }

  const lastKey = pathArray[pathArray.length - 1];
  const lastIndex = lastKey.match(/\[(\d+)\]$/); // Check if the last key ends with '[index]'
  if (lastIndex && Array.isArray(current)) {
    // If the last key is an array index and the property is an array
    const index = parseInt(lastIndex[1]);
    if (index >= current.length) {
      console.error(`Index "${index}" out of bounds for path "${path}".`);
      return obj; // Return the original object and log an error
    }
    current = [...current]; // Create a shallow copy of the array
    current[index] = { ...current[index] }; // Create a shallow copy of the object at the specified index
    current[index][lastKey.substring(0, lastKey.indexOf("["))] = newValue; // Update the value at the specified index
  } else {
    current[lastKey] = newValue; // Update the value
  }

  return { ...obj }; // Return a shallow copy of the modified object
}

function FormLocalManifest({
  data,
  onClose,
}: {
  data: { manifest?: LiveAppManifest };
  onClose: () => void;
}) {
  const { addLocalManifest } = useLocalLiveAppContext();
  const [form, setForm] = useState<LiveAppManifest>({ ...DEFAULT_FORM });
  const [isDapp, setIsDapp] = useState("dapp" in form);

  const handleSwitchEthDapp = () => {
    setIsDapp(prevState => !prevState);
    setForm(prevState => {
      !isDapp ? (prevState.dapp = { ...DEFAULT_FORM.dapp }) : delete prevState.dapp;
      return prevState;
    });
  };

  const formIsValid = useMemo(() => LiveAppManifestSchema.safeParse(form).success, [form]);

  const handleChange = (path: string, value: any) => {
    setForm((prevState: LiveAppManifest) => {
      return updateObjectAtPath(prevState, path, value);
    });
  };

  return (
    <form onSubmit={() => formIsValid && addLocalManifest(form)}>
      <ModalBody
        onClose={onClose}
        onBack={undefined}
        title={
          <Trans
            i18nKey={`settings.developer.createLocalAppModal.title.${
              data.manifest ? "modify" : "create"
            }`}
          />
        }
        noScroll
        render={() => (
          <>
            <ScrollArea>
              <Flex height={"900px"} rowGap={10} flexDirection={"column"}>
                <Flex marginY={"10px"} columnGap={2}>
                  <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
                    {`ETH Dapp`}
                  </Text>
                  <Switch isChecked={isDapp} onChange={handleSwitchEthDapp} />
                  {isDapp && (
                    <Text paddingTop={1} ff="Inter|Medium" fontSize={2}>
                      {`dapp field added`}
                    </Text>
                  )}
                </Flex>

                {Object.keys(form).map((key, index) => {
                  if (key === "content") {
                    return Object.keys(form[key]).map(contentKey => {
                      const value = form[key][contentKey]?.en;
                      const parseCheck = LiveAppManifestSchema.shape.content.shape[
                        contentKey
                      ].safeParse({ en: value }).success;
                      const optional =
                        LiveAppManifestSchema.shape.content.shape[contentKey].isOptional();

                      const path = `${key}.${contentKey}.en`;

                      return (
                        <>
                          <FormLiveAppInput
                            type={typeof form.content[contentKey].en}
                            fieldName={contentKey}
                            value={value}
                            optional={optional}
                            parseCheck={parseCheck}
                            path={path}
                            handleChange={handleChange}
                          />
                        </>
                      );
                    });
                  }

                  if (key === "dapp") {
                    return (
                      <>
                        <NestedFormCategory>
                          <Text ff="Inter|Bold" fontSize={4}>
                            {`${key} `}
                          </Text>
                          {Object.keys(form.dapp as object).map(dappKey => {
                            if (dappKey === "networks") {
                              return form[key][dappKey].map(
                                (networks: LiveAppManifestDapp["networks"], index: number) => {
                                  return (
                                    // eslint-disable-next-line react/jsx-key
                                    <NestedFormCategory>
                                      <Text ff="Inter|Bold" fontSize={4}>
                                        {`${dappKey} ${index + 1}`}
                                      </Text>
                                      {Object.keys(networks).map(networkKey => {
                                        const networkKeySchema =
                                          LiveAppManifestDappSchema.shape[dappKey].element.shape[
                                            networkKey
                                          ];

                                        const optional = networkKeySchema.isOptional();
                                        const value = form[key][dappKey][index][networkKey];
                                        const parseCheck =
                                          networkKeySchema.safeParse(value).success;
                                        const path = `${key}.${dappKey}.${index}.${networkKey}`;

                                        return (
                                          <>
                                            <FormLiveAppInput
                                              type={typeof value}
                                              fieldName={networkKey}
                                              value={value}
                                              optional={optional}
                                              parseCheck={parseCheck}
                                              path={path}
                                              handleChange={handleChange}
                                            />
                                          </>
                                        );
                                      })}
                                    </NestedFormCategory>
                                  );
                                },
                              );
                            }

                            const path = `${key}.${dappKey}`;
                            const value = form[key][dappKey];

                            const parseCheck =
                              LiveAppManifestDappSchema.shape[dappKey].safeParse(value).success;
                            const optional = LiveAppManifestDappSchema.shape[dappKey].isOptional();

                            return (
                              <>
                                <FormLiveAppInput
                                  type={typeof value}
                                  fieldName={dappKey}
                                  value={value}
                                  optional={optional}
                                  parseCheck={parseCheck}
                                  path={path}
                                  handleChange={handleChange}
                                  autoFocus={index === 0}
                                />
                              </>
                            );
                          })}
                          <Flex columnGap={2} justifyContent={"center"}>
                            <Button
                              small
                              primary
                              onClick={() => {
                                setForm(prevState => {
                                  const newNetwork = prevState.dapp.networks;
                                  newNetwork.push(DEFAULT_FORM.dapp.networks[0]);
                                  return {
                                    ...prevState,
                                    dapp: { ...prevState.dapp, networks: newNetwork },
                                  };
                                });
                              }}
                            >
                              {
                                <Trans
                                  i18nKey={`settings.developer.createLocalAppModal.addNetwork`}
                                />
                              }
                            </Button>
                            <Button
                              small
                              danger
                              disabled={form[key].networks.length === 1}
                              onClick={() => {
                                setForm(prevState => {
                                  const newNetwork = prevState.dapp.networks;
                                  newNetwork.pop();
                                  return {
                                    ...prevState,
                                    dapp: { ...prevState.dapp, networks: newNetwork },
                                  };
                                });
                              }}
                            >
                              {
                                <Trans
                                  i18nKey={`settings.developer.createLocalAppModal.removeNetwork`}
                                />
                              }
                            </Button>
                          </Flex>
                        </NestedFormCategory>{" "}
                      </>
                    );
                  }

                  const value = form[key as keyof LiveAppManifest];
                  const isArray = Array.isArray(value);
                  const valueType = isArray ? "array separated by comma" : typeof value;
                  const parseCheck = LiveAppManifestSchema.shape[key].safeParse(value).success;
                  const optional = LiveAppManifestSchema.shape[key].isOptional();
                  const path = `${key}`;
                  return (
                    <>
                      <FormLiveAppInput
                        type={valueType}
                        fieldName={key}
                        value={value}
                        optional={optional}
                        parseCheck={parseCheck}
                        path={path}
                        handleChange={handleChange}
                        isArray={isArray}
                        autoFocus={index === 0}
                      />
                    </>
                  );
                })}
              </Flex>
            </ScrollArea>
            <Flex marginTop={4} width={"100%"} justifyContent={"center"}>
              <Flex width={"100%"} flexDirection={"row"} columnGap={3} justifyContent={"center"}>
                <Button
                  small
                  disabled={!formIsValid}
                  primary
                  onClick={() => {
                    formIsValid && addLocalManifest(form);
                    onClose();
                  }}
                  data-test-id="settings-enable-platform-dev-tools-apps"
                >
                  {
                    <Trans
                      i18nKey={`settings.developer.createLocalAppModal.${
                        data.manifest ? "modify" : "create"
                      }`}
                    />
                  }
                </Button>
              </Flex>
            </Flex>
          </>
        )}
      />
    </form>
  );
}

export default createLocalManifest;
