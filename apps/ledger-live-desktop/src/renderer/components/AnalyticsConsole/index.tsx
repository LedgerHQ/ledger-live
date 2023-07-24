import React, { useCallback, useState } from "react";
import styled from "styled-components";
import EventList from "./EventList";
import StyleProviderV3 from "~/renderer/styles/StyleProviderV3";
import { Divider, Flex, IconsLegacy, Switch, Text } from "@ledgerhq/react-ui";

const Root = styled.div`
  position: fixed;
  z-index: 9999999999;
  top: 0;
  left: 0;
  height: 100%;
`;

enum Visibility {
  opaque = "opaque",
  transparent = "transparent",
  hidden = "hidden",
}

const Container = styled(Flex)`
  position: fixed;
  top: 60px;
  bottom: 10px;
  pointer-events: none;
`;

const ButtonContainer = styled(Flex)`
  height: 24px;
  width: 24px;
  border-radius: 4px;
  background-color: white;
  border: 1px solid black;
  justify-content: center;
  align-items: center;
  align-self: flex-end;
  pointer-events: auto;
  :hover {
    cursor: pointer;
  }
`;

const EventListContainer = styled.div<{ visibility: Visibility }>`
  visibility: ${p => (p.visibility === Visibility.hidden ? "hidden" : "auto")};
  background-color: ${p => (p.visibility === Visibility.opaque ? "#fff" : "#ffffff88")};
  pointer-events: ${p => (p.visibility === Visibility.opaque ? "auto" : "none")};
  overflow: scroll;
`;

function AnalyticsConsole() {
  const [position, setPosition] = useState<"left" | "right">("right");
  const [visibility, setVisibility] = useState<Visibility>(Visibility.transparent);
  const [showExtraProps, setShowExtraProps] = useState(false);
  const [hideSyncEvents, setHideSyncEvents] = useState(false);
  const onClickDebugButton = useCallback(() => {
    switch (visibility) {
      case Visibility.hidden:
        setVisibility(Visibility.transparent);
        break;
      case Visibility.transparent:
        setVisibility(Visibility.opaque);
        break;
      case Visibility.opaque:
      default:
        setVisibility(Visibility.hidden);
        break;
    }
  }, [visibility]);
  const onClickArrowButton = useCallback(() => {
    setPosition(position === "left" ? "right" : "left");
  }, [position]);

  return (
    <StyleProviderV3 selectedPalette={"light"}>
      <Root>
        <Container
          flexDirection={position === "left" ? "row-reverse" : "row"}
          style={{ [position]: "10px" }}
        >
          <EventListContainer visibility={visibility}>
            {visibility === Visibility.opaque ? (
              <Flex flexDirection={"column"} rowGap={3} px={2} py={3} flexShrink={1} flexGrow={0}>
                <Switch
                  label="Show extra properties"
                  name="Show extra properties"
                  checked={showExtraProps}
                  onChange={() => setShowExtraProps(!showExtraProps)}
                />
                <Switch
                  label="Hide Sync* events"
                  name="Hide Sync* events"
                  checked={hideSyncEvents}
                  onChange={() => setHideSyncEvents(!hideSyncEvents)}
                />
                <Text fontSize={3}>Click on an event to show its extra properties</Text>
                <Divider />
              </Flex>
            ) : null}

            <EventList showExtraProps={showExtraProps} hideSyncEvents={hideSyncEvents} />
          </EventListContainer>
          <Flex alignSelf={"flex-end"} flexDirection={"column"} style={{ pointerEvents: "auto" }}>
            <ButtonContainer onClick={onClickArrowButton}>
              {position === "left" ? (
                <IconsLegacy.ArrowRightMedium size={18} color="black" />
              ) : (
                <IconsLegacy.ArrowLeftMedium size={18} color="black" />
              )}
            </ButtonContainer>
            <ButtonContainer onClick={onClickDebugButton}>
              <IconsLegacy.ActivityMedium size={18} color="black" />
            </ButtonContainer>
          </Flex>
        </Container>
      </Root>
    </StyleProviderV3>
  );
}

export default AnalyticsConsole;
