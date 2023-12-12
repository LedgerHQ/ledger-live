import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { Feature_Storyly, StorylyInstanceType } from "@ledgerhq/types-live";
import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from "react";
import { type StorylyOptions } from "./useStoryly";
import "storyly-web";

interface StorylyProviderProps {
  children: ReactNode;
}

interface StorylyContextType {
  url: string | null;
  setUrl: (id: string | null) => void;
}

const StorylyContext = createContext<StorylyContextType | undefined>(undefined);

type StoriesType = Feature_Storyly["params"] extends { stories: infer S } ? S : never;

type openStoryParams = {
  group?: string;
  story?: string;
  playMode?: string;
};

const getTokenForInstanceId = (stories: StoriesType, targetInstanceId: string): string | null => {
  const foundStory = Object.values(stories) as StorylyInstanceType[];
  const matchingStory = foundStory.find(story => story.instanceId === targetInstanceId);
  return matchingStory ? matchingStory?.token : null;
};

type StorylyRef = {
  init: (options: StorylyOptions & { events: { closeStoryGroup: () => void } }) => void;
  openStory: (props: openStoryParams) => void;
};

const StorylyProvider: React.FC<StorylyProviderProps> = ({ children }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState<{ g?: string; s?: string; play?: string }>({});

  const storylyRef = useRef<StorylyRef>(null);

  const {
    // @ts-expect-error TYPINGS
    params: { stories },
  } = useFeature("storyly") || {};

  const storyly = useFeature("storyly");

  useEffect(() => {
    if (!storyly || !token || !query) return;
    storylyRef.current?.init({
      layout: "classic",
      token: token,
      events: {
        closeStoryGroup: clear,
      },
    });
    storylyRef.current?.openStory({ group: query?.g, story: query?.s, playMode: query?.play });
  }, [storyly, token, query]);

  useEffect(() => {
    if (url) {
      console.log("effectStartup");
      const storylyUrl = new URL(`ledgerlive://${url}`);
      const { searchParams } = storylyUrl;
      const storylyQuery = Object.fromEntries(searchParams);
      setQuery(storylyQuery);
      if (storylyQuery?.instance)
        setToken(getTokenForInstanceId(stories as StoriesType, storylyQuery?.instance));
    }
  }, [stories, url]);

  const clear = () => {
    setUrl(null);
    setToken(null);
    setQuery({});
  };

  return (
    <StorylyContext.Provider value={{ url, setUrl }}>
      {children}
      {/* @ts-expect-error the `storyly-web` package doesn't provide any typings yet. */}
      {token && <storyly-web ref={storylyRef} />}
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
