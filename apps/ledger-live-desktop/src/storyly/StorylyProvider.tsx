import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Feature_Storyly, StorylyInstanceType } from "@ledgerhq/types-live";

import { StorylyRef } from "storyly-web";
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
  return matchingStory ? matchingStory?.token : null;
};

const StorylyProvider: React.FC<StorylyProviderProps> = ({ children }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState<{ g?: string; s?: string; play?: string }>({});

  const storylyRef = useRef<StorylyRef>(null);

  const { params } = useFeature("storyly") || {};
  const stories = params?.stories;

  useEffect(() => {
    if (!params || !token || !query) return;
    storylyRef.current?.init({
      layout: "classic",
      token: token,
      events: {
        closeStoryGroup: clear,
      },
    });
    storylyRef.current?.openStory({ group: query?.g, story: query?.s, playMode: query?.play });
  }, [params, token, query]);

  useEffect(() => {
    if (url) {
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
      {/* @ts-expect-error even by typing the package (types/storyly-web.d.ts), the way it is exported for a global use prevents typescript from figuring out what's happening */}
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
