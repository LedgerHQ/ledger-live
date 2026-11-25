package com.ledger.live

import android.os.Build
import android.view.Window
import androidx.core.graphics.ColorUtils
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/** Paints the navigation bar on Android 10-14; see shared/system-bars/README.md "Background color". */
class NavigationBarColorModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private var lastRequestedArgbColor: Int? = null

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        reactContext.addLifecycleEventListener(this)
    }

    override fun invalidate() {
        reactContext.removeLifecycleEventListener(this)
        super.invalidate()
    }

    @ReactMethod
    fun setBackgroundColor(argbColor: Double) {
        if (Build.VERSION.SDK_INT < RESTORED_MIN_SDK) return

        val color = argbColor.toLong().toInt()
        UiThreadUtil.runOnUiThread {
            lastRequestedArgbColor = color
            reactContext.currentActivity?.window?.paintBackground(color)
        }
    }

    override fun onHostResume() {
        val color = lastRequestedArgbColor ?: return
        val window = reactContext.currentActivity?.window ?: return
        window.paintBackground(color)
        window.restoreButtonStyle(color)
    }

    override fun onHostPause() = Unit

    override fun onHostDestroy() = Unit

    private fun Window.paintBackground(argbColor: Int) {
        if (Build.VERSION.SDK_INT !in PAINTED_SDK_RANGE) return
        @Suppress("DEPRECATION")
        navigationBarColor = argbColor
    }

    private fun Window.restoreButtonStyle(backgroundArgbColor: Int) {
        val hasLightBackground =
            ColorUtils.calculateLuminance(backgroundArgbColor) > LIGHT_BACKGROUND_LUMINANCE_THRESHOLD
        WindowInsetsControllerCompat(this, decorView).isAppearanceLightNavigationBars = hasLightBackground
    }

    companion object {
        const val NAME = "NavigationBarColorModule"
        private const val RESTORED_MIN_SDK = Build.VERSION_CODES.Q
        private val PAINTED_SDK_RANGE = Build.VERSION_CODES.Q until Build.VERSION_CODES.VANILLA_ICE_CREAM
        private const val LIGHT_BACKGROUND_LUMINANCE_THRESHOLD = 0.5
    }
}
