package com.ledger.live

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * Whether the app is in the foreground, from the process lifecycle rather than the activity's.
 * React Native's AppState reports "background" as soon as the activity pauses, which a permission
 * dialog shown over the app is enough for. The process only stops once no screen of the app is
 * visible any more.
 */
class AppVisibilityModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), DefaultLifecycleObserver {

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        UiThreadUtil.runOnUiThread { ProcessLifecycleOwner.get().lifecycle.addObserver(this) }
    }

    override fun invalidate() {
        UiThreadUtil.runOnUiThread { ProcessLifecycleOwner.get().lifecycle.removeObserver(this) }
        super.invalidate()
    }

    override fun onStop(owner: LifecycleOwner) {
        reactContext.emitDeviceEvent(BACKGROUND_EVENT)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isInForeground(): Boolean =
        ProcessLifecycleOwner.get().lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)

    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Double) = Unit

    companion object {
        const val NAME = "AppVisibilityModule"
        private const val BACKGROUND_EVENT = "appDidEnterBackground"
    }
}
