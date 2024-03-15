/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { SyntheticEvent, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Flex } from "@ledgerhq/react-ui";
import Input from "~/renderer/components/Input";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import Text from "~/renderer/components/Text";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";

function createLocalManifest() {
  return (
    <Modal
      name="MODAL_CREATE_LOCAL_APP"
      centered
      render={({ data, onClose }) => <FormLocalManifest data={data} onClose={onClose} />}
    />
  );
}

function FormLocalManifest({
  data,
  onClose,
}: {
  data: { manifest?: LiveAppManifest };
  onClose: () => void;
}) {
  const {
    addLocalManifest,
    state: { liveAppByIndex },
  } = useLocalLiveAppContext();

  const [form, setForm] = useState<LiveAppManifest>(
    liveAppByIndex.find(manifest => manifest.id === data.manifest?.id) ?? {
      id: "ReplaceAppName",
      name: "ReplaceAppName",
      url: "http://localhost:3000",
      homepageUrl: "http://localhost:3000/",
      platforms: ["ios", "android", "desktop"],
      apiVersion: "^2.0.0",
      manifestVersion: "2",
      branch: "stable",
      categories: ["NFT", "Swap", "YourAppCategory"],
      currencies: ["*"],
      content: {
        shortDescription: {
          en: "shortDescription",
        },
        description: {
          en: "description",
        },
      },
      permissions: [],
      domains: ["http://*"],
      visibility: "complete",
    },
  );

  const submitLocalApp = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      if (e) {
        e.preventDefault();
      }
      addLocalManifest(form);
    },
    [addLocalManifest, form],
  );

  const handleChange = (field: string, value: string | string[]) => {
    setForm(prevState => {
      const isContentField = field === "description" || field === "shortDescription";
      return {
        ...prevState,
        ...(isContentField
          ? {
              content: {
                ...prevState.content,
                [field]: { en: value },
              },
            }
          : {
              [field]: value,
            }),
      };
    });
  };

  const input = (
    type: string,
    key: string,
    isArray?: boolean,
    autoFocus?: boolean,
    disabled?: boolean,
  ) => {
    const value =
      key === "description" || key === "shortDescription"
        ? form.content[key]?.en
        : form[key as keyof LiveAppManifest];

    return (
      <Flex marginY={"10px"} flexDirection={"column"}>
        <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
          {`${key} (${type}) `}
        </Text>
        <Input
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={value => handleChange(key, isArray ? value.split(",") : value)}
          value={String(value)}
        />
      </Flex>
    );
  };

  return (
    <form onSubmit={submitLocalApp}>
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
              <Flex height={"900px"} flexDirection={"column"}>
                {Object.keys(form).map((key, index) => {
                  if (key === "content") {
                    return (
                      <>
                        {input(typeof form.content.description.en, "description", false)}
                        {input(typeof form.content.shortDescription.en, "shortDescription", false)}
                      </>
                    );
                  }

                  const value = form[key as keyof LiveAppManifest];
                  const isArray = Array.isArray(value);
                  const valueType = isArray ? "array separated by comma" : typeof value;

                  return input(valueType, key, isArray, index === 0, data.manifest && key === "id");
                })}
              </Flex>
            </ScrollArea>
            <Flex marginTop={4} width={"100%"} justifyContent={"center"}>
              <Flex width={"100%"} flexDirection={"row"} columnGap={3} justifyContent={"center"}>
                <Button
                  small
                  primary
                  onClick={(e: React.SyntheticEvent<HTMLFormElement, Event>) => {
                    submitLocalApp(e);
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
