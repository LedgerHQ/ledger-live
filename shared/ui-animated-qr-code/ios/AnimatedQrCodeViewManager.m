#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(SharedAnimatedQrCodeViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(animation, NSString)
RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
RCT_EXPORT_VIEW_PROPERTY(pressCount, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(moduleCount, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(dots, NSArray)

@end
