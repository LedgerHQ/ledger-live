import { Theme } from "@ledgerhq/native-ui/styles/theme";

export const inAppBrowserDefaultParams = (theme: Theme) => {
  return {
    // iOS Properties
    dismissButtonStyle: "close",
    preferredBarTintColor: theme.colors.background.drawer,
    preferredControlTintColor: theme.colors.neutral.c100,
    readerMode: false,
    animated: true,
    modalPresentationStyle: "fullScreen",
    modalTransitionStyle: "coverVertical",
    modalEnabled: true,
    enableBarCollapsing: false,
    // Android Properties
    showTitle: true,
    toolbarColor: theme.colors.background.drawer,
    secondaryToolbarColor: theme.colors.neutral.c100,
    navigationBarColor: theme.colors.background.drawer,
    navigationBarDividerColor: theme.colors.neutral.c100,
    enableUrlBarHiding: false,
    enableDefaultShare: true,
    forceCloseOnRedirection: false,
    // Specify full animation resource identifier(package:anim/name)
    // or only resource name(in case of animation bundled with app).
    animations: {
      startEnter: "slide_in_right",
      startExit: "slide_out_left",
      endEnter: "slide_in_left",
      endExit: "slide_out_right",
    },
  };
};
