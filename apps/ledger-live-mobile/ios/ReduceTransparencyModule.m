//
//  ReduceTransparencyModule.m
//  ledgerlivemobile
//
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

#import <React/RCTBridgeModule.h>

// UIViewPropertyAnimator sets NSNull as the internal CAAnimation delegate. Detox hooks into
// animationDidStop:finished: and forwards __detox_sync_untrackAnimation to the original delegate,
// crashing when that delegate is NSNull. This no-op category prevents the crash in debug builds.
#if DEBUG
@interface NSNull (DetoxSyncFix)
@end
@implementation NSNull (DetoxSyncFix)
- (void)__detox_sync_untrackAnimation {}
@end
#endif

@interface RCT_EXTERN_MODULE(ReduceTransparencyModule, NSObject)

RCT_EXTERN_METHOD(getReduceTransparencyEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
