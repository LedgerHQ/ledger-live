#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import "RNSplashScreen.h"  // here

#import <Firebase.h>

/* #ifdef FB_SONARKIT_ENABLED */
/* #import <FlipperKit/FlipperClient.h> */
/* #import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h> */
/* #import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h> */
/* #import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h> */
/* #import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h> */
/* #import <FlipperKitReactPlugin/FlipperKitReactPlugin.h> */

/* static void InitializeFlipper(UIApplication *application) { */
/*   FlipperClient *client = [FlipperClient sharedClient]; */
/*   SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults]; */
/*   [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]]; */
/*   [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]]; */
/*   [client addPlugin:[FlipperKitReactPlugin new]]; */
/*   [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]]; */
/*   [client start]; */
/* } */
/* #endif */

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
/* #ifdef FB_SONARKIT_ENABLED */
/*   InitializeFlipper(application); */
/* #endif */

  [FIRApp configure];

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"ledgerlivemobile"
                                            initialProperties:nil];

  if (@available(iOS 13.0, *)) {
      rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
      rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  [super application:application didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

- (void) showOverlay{
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleRegular];
  UIVisualEffectView *blurEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
  UIImageView *logoView = [[UIImageView alloc]initWithImage:[UIImage imageNamed:@"Blurry_nocache1"]];
  logoView.contentMode = UIViewContentModeScaleAspectFit;
  blurEffectView.frame = [self.window bounds];
  blurEffectView.tag = 12345;
  logoView.tag = 12346;

  blurEffectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self.window addSubview:blurEffectView];
  [self.window addSubview:logoView];
  [self.window bringSubviewToFront:logoView];

  [logoView setContentHuggingPriority:251 forAxis:UILayoutConstraintAxisHorizontal];
  [logoView setContentHuggingPriority:251 forAxis:UILayoutConstraintAxisVertical];
  logoView.frame = CGRectMake(0, 0, 128, 128);

  logoView.center = CGPointMake(self.window.frame.size.width  / 2,self.window.frame.size.height / 2);
}

- (void) hideOverlay{
  UIView *blurEffectView = [self.window viewWithTag:12345];
  UIView *logoView = [self.window viewWithTag:12346];

  [UIView animateWithDuration:0.5 animations:^{
    blurEffectView.alpha = 0;
    logoView.alpha = 0;
  } completion:^(BOOL finished) {
    // remove when finished fading
    [blurEffectView removeFromSuperview];
    [logoView removeFromSuperview];
  }];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  [self hideOverlay];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
  [self showOverlay];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

@end
