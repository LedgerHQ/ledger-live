package com.ledger.live

import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/** Paints the navigation bar on Android 10-14; see shared/system-bars/README.md "Background color". */
class NavigationBarColorModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun setBackgroundColor(argbColor: Double) {
        if (Build.VERSION.SDK_INT !in PAINTED_SDK_RANGE) return

        UiThreadUtil.runOnUiThread {
            @Suppress("DEPRECATION")
            reactContext.currentActivity?.window?.navigationBarColor = argbColor.toLong().toInt()
        }
    }

    companion object {
        const val NAME = "NavigationBarColorModule"
        private val PAINTED_SDK_RANGE = Build.VERSION_CODES.Q until Build.VERSION_CODES.VANILLA_ICE_CREAM
    }
}
