package com.ledger.animatedqrcode

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class AnimatedQrCodeViewManager : SimpleViewManager<AnimatedQrCodeView>() {
    override fun getName(): String = "SharedAnimatedQrCodeView"

    override fun createViewInstance(context: ThemedReactContext): AnimatedQrCodeView =
        AnimatedQrCodeView(context)

    @ReactProp(name = "animation")
    fun setAnimation(view: AnimatedQrCodeView, animation: String?) {
        view.animation = animation ?: "shimmer"
    }

    @ReactProp(name = "autoPlay", defaultBoolean = false)
    fun setAutoPlay(view: AnimatedQrCodeView, autoPlay: Boolean) {
        view.autoPlay = autoPlay
    }

    @ReactProp(name = "moduleCount", defaultInt = 0)
    fun setModuleCount(view: AnimatedQrCodeView, moduleCount: Int) {
        view.moduleCount = moduleCount
    }

    @ReactProp(name = "dots")
    fun setDots(view: AnimatedQrCodeView, dots: ReadableArray?) {
        view.dots = IntArray(dots?.size() ?: 0) { index -> dots!!.getInt(index) }
    }
}
