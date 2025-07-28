package com.ledger.live

import android.app.Application
import android.util.Log

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactApplication

class StartupInfoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "StartupInfoModule"

        private var sStartupType: String? = null
        private var sStartupDuration: Double = 0.0
        private var sResumeStartTime: Double = 0.0
        private var sTimeInBackground: Double = 0.0

        private var sApplicationInstance: Application? = null

        private fun getReactContextSafely(): ReactApplicationContext? {
            return sApplicationInstance?.let { app ->
                if (app is ReactApplication) {
                    (app as ReactApplication).reactNativeHost.reactInstanceManager.currentReactContext as? ReactApplicationContext
                } else {
                    null
                }
            }
        }

        // --- IMPORTANT: Add @JvmStatic here ---
        @JvmStatic
        fun setStartupInfo(startupType: String, startupDuration: Double, resumeStartTime: Double, timeInBackground: Double) {
            sStartupType = startupType
            sStartupDuration = startupDuration
            sResumeStartTime = resumeStartTime
            sTimeInBackground = timeInBackground

            Log.d(TAG, "Startup info received by module (static): Type=$startupType, Duration=${startupDuration * 1000} ms")

            val reactContext = getReactContextSafely()
            if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                val params = Arguments.createMap().apply {
                    putString("startupType", startupType)
                    putDouble("startupDuration", startupDuration * 1000)
                    putDouble("resumeStartTime", resumeStartTime * 1000)
                    putDouble("timeInBackground", timeInBackground * 1000)
                }
                // Log params BEFORE emitting
                Log.d(TAG, "Emitting 'NativeStartupInfoUpdate' event to JS: $params")
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("NativeStartupInfoUpdate", params)
            } else {
                Log.w(TAG, "React Native bridge not yet ready or inactive. Event not emitted to JS immediately.")
            }
        }
    }

    init {
        sApplicationInstance = reactContext.applicationContext as? Application
        Log.d(TAG, "StartupInfoModule initialized by RN bridge.")
    }

    override fun getName(): String {
        return "StartupInfoModule"
    }

    @ReactMethod
    fun getInitialStartupInfo(promise: Promise) {
        if (sStartupType != null) {
            val startupInfo = Arguments.createMap().apply {
                putString("startupType", sStartupType)
                putDouble("startupDuration", sStartupDuration * 1000)
                putDouble("resumeStartTime", sResumeStartTime * 1000)
                putDouble("timeInBackground", sTimeInBackground * 1000)
            }
            // --- FIX: Log the map BEFORE resolving the promise ---
            Log.d(TAG, "Provided initial startup info to JS: $startupInfo") // Log it here
            promise.resolve(startupInfo) // Then resolve it
        } else {
            promise.reject("NO_STARTUP_INFO", "Native startup information not yet available in static variables.")
            Log.w(TAG, "Failed to provide initial startup info to JS: Static variables not set yet.")
        }
    }
}