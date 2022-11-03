import { useEffect } from "react";

function useStoryly() {
  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://web-story.storyly.io/v2/storyly-web.js";
    script["custom-element"] = "storyly-web";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
}

export default useStoryly;
