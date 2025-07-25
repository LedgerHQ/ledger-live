// StartupInfoModule.mm
#import "StartupInfoModule.h" // Your module's header
#import <React/RCTLog.h>     // For RCTLog, useful for debugging native side

// --- UserDefaults Keys (Must match AppDelegate.mm) ---
// Define these constants here and in AppDelegate.mm to ensure consistency.
// Make sure they are declared outside the @implementation block.
NSString *const kNativeStartupTypeKey = @"NativeStartupType";
NSString *const kNativeStartupDurationKey = @"NativeStartupDuration";

// --- Notification Name (for internal communication from class method to instance) ---
NSString *const kNativeStartupInfoUpdatedNotification = @"NativeStartupInfoUpdatedNotification";


@implementation StartupInfoModule

// This macro exports the module to React Native.
// By default, the JavaScript module name will be the same as the Objective-C class name ("StartupInfoModule").
RCT_EXPORT_MODULE();

// --- RCTEventEmitter Required Methods ---

// This method specifies the event names your module will emit to JavaScript.
// Add all event names that you plan to send from this module.
- (NSArray<NSString *> *)supportedEvents {
    return @[@"NativeStartupInfoUpdate"]; // This is the event name JS will listen for
}

// Called when the first JavaScript listener for this module's events is added.
// Implement any logic needed when you start observing native notifications or events.
- (void)startObserving {
    // We already set up the NSNotificationCenter observer in init,
    // but if you had other native observers to start/stop, they'd go here.
    RCTLogInfo(@"[StartupInfoModule] Started observing events.");
}

// Called when the last JavaScript listener for this module's events is removed.
// Implement any cleanup logic when no more JS listeners are active.
- (void)stopObserving {
    // We handle NSNotificationCenter observer cleanup in dealloc,
    // but other native observers would be stopped here.
    RCTLogInfo(@"[StartupInfoModule] Stopped observing events.");
}

// --- Internal Data Storage and Notification Setup ---

// Override the initializer to set up the NSNotificationCenter observer.
// This allows the class method `setStartupType:duration:timeInBackground:` to indirectly
// send events via a notification to an *instance* of this module that can then emit to JS.
- (instancetype)init {
    self = [super init];
    if (self) {
        // Add an observer for the custom notification.
        // When this notification is posted (by the static setStartupType method),
        // `emitStartupInfoUpdate:` will be called on this module instance.
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(emitStartupInfoUpdate:)
                                                     name:kNativeStartupInfoUpdatedNotification
                                                   object:nil];
    }
    return self;
}

// Clean up the observer when the module instance is deallocated.
- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:kNativeStartupInfoUpdatedNotification
                                                  object:nil];
}


// --- Class Method to Receive Data from AppDelegate.mm ---
// This static (class) method is called by AppDelegate.mm to pass the startup data.
// It stores the data in UserDefaults and then posts an NSNotification.
+ (void)setStartupType:(NSString *)type duration:(NSTimeInterval)duration{
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setObject:type forKey:kNativeStartupTypeKey];
    [userDefaults setObject:@(duration) forKey:kNativeStartupDurationKey];
    [userDefaults synchronize]; // Ensures immediate write to disk

    RCTLogInfo(@"[StartupInfoModule] Native startup info stored in UserDefaults: Type=%@, Duration=%.3f s", type, duration);

    // Post a notification that our module instances are listening for.
    // This is how a static method can trigger an instance method (sendEventWithName) indirectly.
    [[NSNotificationCenter defaultCenter] postNotificationName:kNativeStartupInfoUpdatedNotification
                                                        object:nil
                                                      userInfo:@{
                                                          @"startupType": type,
                                                          @"startupDuration": @(duration), // Pass as NSNumber
                                                      }];
}

// --- Instance Method to Emit Event to JavaScript ---
// This method is called by the NSNotificationCenter observer in `init`.
- (void)emitStartupInfoUpdate:(NSNotification *)notification {
    NSDictionary *userInfo = notification.userInfo;
    if (userInfo) {
        // Create a mutable dictionary to adjust values for JavaScript if needed
        NSMutableDictionary *jsInfo = [userInfo mutableCopy];

        // Convert durations from seconds (NSTimeInterval) to milliseconds for JavaScript
        // (as performance.now() in JS typically gives milliseconds)
        jsInfo[@"startupDuration"] = @([userInfo[@"startupDuration"] doubleValue] * 1000);

        // Send the event to all active JavaScript listeners
        [self sendEventWithName:@"NativeStartupInfoUpdate" body:jsInfo];
        RCTLogInfo(@"[StartupInfoModule] Emitted 'NativeStartupInfoUpdate' event to JS with info: %@", jsInfo);
    }
}


// --- Exported Method for JavaScript to Get Initial Data ---
// This allows JavaScript to explicitly request the most recent startup info
// (e.g., on initial component mount after a cold launch).
// RCT_REMAP_METHOD allows you to give the JS method a different name.
RCT_REMAP_METHOD(getInitialStartupInfo,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    NSString *startupType = [userDefaults stringForKey:kNativeStartupTypeKey];
    NSNumber *startupDuration = [userDefaults objectForKey:kNativeStartupDurationKey];

    if (startupType && startupDuration) {
        // Prepare dictionary for JS, converting durations to milliseconds
        NSDictionary *startupInfo = @{
            @"startupType": startupType,
            @"startupDuration": @([startupDuration doubleValue] * 1000), // Convert to ms
        };
        resolve(startupInfo);
        RCTLogInfo(@"[StartupInfoModule] Provided initial startup info to JS: %@", startupInfo);
    } else {
        // If data isn't found, reject the promise
        reject(@"no_startup_info", @"Native startup information not yet set or found in UserDefaults.", nil);
        RCTLogWarn(@"[StartupInfoModule] Failed to provide initial startup info to JS: Data not found.");
    }
}

@end
