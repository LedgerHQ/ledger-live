import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { Flex } from "@ledgerhq/native-ui";
import { Feature_Storyly, StorylyInstanceType } from "@ledgerhq/types-live";
import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from "react";
import { Storyly } from "storyly-react-native";

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

  const storylyRef = useRef<Storyly>(null);

  const {
    // @ts-expect-error TYPINGS
    params: { stories },
  } = useFeature("storyly") || {};

  useEffect(() => {
    if (url) {
      const storylyUrl = new URL(`ledgerlive://${url}`);
      const { searchParams } = storylyUrl;
      const storylyQuery = Object.fromEntries(searchParams);
      if (storylyQuery?.instance)
        setToken(getTokenForInstanceId(stories as StoriesType, storylyQuery?.instance));
    }
  }, [stories, url]);

  const handleLoad = () => {
    if (url) {
      storylyRef?.current?.openStory(url);
    }
  };

  const clear = () => {
    setUrl(null);
    setToken(null);
  };

  const handleEvent = (e: Storyly.StoryEvent) => {
    if (e.event === "StoryGroupClosed" || e.event === "StoryGroupCompleted") clear();
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
