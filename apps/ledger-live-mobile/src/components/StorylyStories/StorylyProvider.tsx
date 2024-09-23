import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Flex } from "@ledgerhq/native-ui";
import { Linking } from "react-native";
import { Feature_Storyly, StorylyInstanceType } from "@ledgerhq/types-live";
import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from "react";
import { Storyly } from "storyly-react-native";
import { useSettings } from "~/hooks";

interface StorylyProviderProps {
  children: ReactNode;
}

interface StorylyContextType {
  url: string | null;
  setUrl: (id: string | null) => void;
}

const StorylyContext = createContext<StorylyContextType | undefined>(undefined);

type StoriesType = Feature_Storyly["params"] extends { stories: infer S } ? S : never;

const getTokenForInstanceId = (stories: StoriesType, targetInstanceId: string): string | null => {
  const foundStory = Object.values(stories) as StorylyInstanceType[];
  const matchingStory = foundStory.find(story => story.instanceId === targetInstanceId);
  return matchingStory ? matchingStory.token : null;
};

const StorylyProvider: React.FC<StorylyProviderProps> = ({ children }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { language } = useSettings();

  const storylyRef = useRef<Storyly>(null);

  const { params } = useFeature("storyly") || {};
  const stories = params?.stories;

  useEffect(() => {
    if (url) {
      const storylyUrl = new URL(`ledgerlive://${url}`);
      const { searchParams } = storylyUrl;
      const storylyQuery = Object.fromEntries(searchParams);
      if (storylyQuery?.instance && storylyQuery?.play && storylyQuery?.play === "sg") {
        //Storyly is not mounting properly if the play mode is undefined or equal to "s". We only support opening play="sg" for now
        //Mounting it without the play tag to sg will result in the story not closing properly and black screen
        setToken(getTokenForInstanceId(stories as StoriesType, storylyQuery?.instance));
      } else {
        setUrl(null);
      }
    }
  }, [stories, url]);

  const handleLoad = () => {
    if (url) {
      storylyRef?.current?.openStory(url);
    }
  };

  const clear = () => {
    storylyRef?.current?.closeStory();
    setUrl(null);
    setToken(null);
  };

  const handleEvent = (e: Storyly.StoryEvent) => {
    if (
      (e.event === "StoryPreviousClicked" && e.story?.index === 0) ||
      ["StoryGroupClosed", "StoryGroupCompleted"].includes(e.event)
    ) {
      clear();
    }
    if (e.event === "StoryCTAClicked" && e?.story?.actionUrl) {
      Linking.openURL(e.story.actionUrl);
      clear();
    }
  };

  return (
    <StorylyContext.Provider value={{ url, setUrl }}>
      {children}
      {token && url ? (
        <Flex height={0}>
          <Storyly
            storylyId={token}
            ref={storylyRef}
            style={{ flex: 1 }} // necessary for touches to work
            onLoad={handleLoad}
            onEvent={handleEvent}
            storylyLocale={language}
          />
        </Flex>
      ) : null}
    </StorylyContext.Provider>
  );
};

const useStorylyContext = () => {
  const context = useContext(StorylyContext);
  if (!context) {
    throw new Error("useStoryly must be used within a StorylyProvider");
  }
  return context;
};

export { StorylyProvider, useStorylyContext };
