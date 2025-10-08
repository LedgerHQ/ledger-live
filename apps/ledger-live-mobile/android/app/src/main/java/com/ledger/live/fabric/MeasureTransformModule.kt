package com.ledger.live.fabric

import android.util.Log
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType

/**
 * TurboModule that provides transform-aware view measurement.
 * 
 * This solves the issue where Pressability hit testing fails during animations
 * because measure() only returns layout data without transforms.
 * 
 * Usage from JavaScript:
 * ```
 * import {NativeModules} from 'react-native';
 * NativeModules.MeasureTransform.measureWithTransform(
 *   surfaceId, reactTag, (x, y, width, height, pageX, pageY) => { ... }
 * );
 * ```
 */
class MeasureTransformModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MeasureTransform"

    /**
     * Measure a view including its animation transforms.
     * 
     * This runs on the UI thread and reads the actual View.getMatrix() which
     * includes all transforms applied by React Native Reanimated.
     * 
     * @param surfaceId The React surface ID (root view tag)
     * @param reactTag The view's React tag
     * @param callback JavaScript callback receiving (x, y, width, height, pageX, pageY)
     */
    @ReactMethod
    fun measureWithTransform(surfaceId: Double, reactTag: Double, callback: Callback) {
        val surfaceIdInt = surfaceId.toInt()
        val reactTagInt = reactTag.toInt()

        Log.d(TAG, "measureWithTransform called: surfaceId=$surfaceIdInt, reactTag=$reactTagInt")

        try {
            // Get the Fabric UIManager
            val uiManager = UIManagerHelper.getUIManager(
                reactApplicationContext,
                UIManagerType.FABRIC
            ) as? FabricUIManager

            if (uiManager == null) {
                Log.e(TAG, "Failed to get FabricUIManager")
                callback.invoke(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
                return
            }

            // Schedule measurement on the UI thread
            UiThreadUtil.runOnUiThread {
                try {
                    // Get the target view
                    val targetView = uiManager.resolveView(reactTagInt)

                    if (targetView == null) {
                        Log.e(TAG, "Target view not found for tag: $reactTagInt")
                        callback.invoke(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
                        return@runOnUiThread
                    }

                    // Measure in absolute window coordinates (not relative to root)
                    // This ensures we get the actual screen position including transforms
                    val outputBuffer = IntArray(4)
                    MeasureAsyncUtil.measureInWindow(targetView, outputBuffer)

                    // Convert from pixels to DIPs (density-independent pixels)
                    val x = 0.0 // Local x is always 0
                    val y = 0.0 // Local y is always 0
                    val width = PixelUtil.toDIPFromPixel(outputBuffer[2].toFloat())
                    val height = PixelUtil.toDIPFromPixel(outputBuffer[3].toFloat())
                    val pageX = PixelUtil.toDIPFromPixel(outputBuffer[0].toFloat())
                    val pageY = PixelUtil.toDIPFromPixel(outputBuffer[1].toFloat())

                    Log.d(TAG, "✅ Measured with transform: pageX=$pageX, pageY=$pageY, " +
                        "width=$width, height=$height (tag=$reactTagInt)")

                    // Return results to JavaScript
                    callback.invoke(x, y, width, height, pageX, pageY)
                } catch (e: Exception) {
                    Log.e(TAG, "Error measuring view: ${e.message}", e)
                    callback.invoke(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scheduling measurement: ${e.message}", e)
            callback.invoke(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
        }
    }

    companion object {
        private const val TAG = "MeasureTransform"
    }
}

