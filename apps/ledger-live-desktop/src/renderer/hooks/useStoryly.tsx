function useStoryly() {
  /**
   * Disabled for now, until we have a better solution without a remote script loading
   * (Storyly team is working on a package)
   */
  // useEffect(() => {
  //   const script = document.createElement("script");
  //   script.src = "https://web-story.storyly.io/v2/storyly-web.js";
  //   script["custom-element"] = "storyly-web";
  //   script.async = true;
  //   document.body.appendChild(script);
  //   return () => {
  //     document.body.removeChild(script);
  //   };
  // }, []);
}

export default useStoryly;
