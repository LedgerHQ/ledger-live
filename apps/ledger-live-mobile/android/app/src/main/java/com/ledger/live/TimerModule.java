package com.ledger.live;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class TimerModule extends ReactContextBaseJavaModule {
    public TimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "Timer";
    }

    /**
     * Return a relative unit of time in seconds that cannot be influenced by the user
     * @param promise
     */
    @ReactMethod
    public void getRelativeTime(Promise promise) {
        // System time in milliseconds
        long time = android.os.SystemClock.elapsedRealtime();

        // React Native bridge complains if we try to pass back a long directly
        promise.resolve(Long.toString(time / 1000));
    }
}
