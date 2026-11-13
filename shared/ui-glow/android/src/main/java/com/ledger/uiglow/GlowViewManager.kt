package com.ledger.uiglow

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.GlowViewManagerDelegate
import com.facebook.react.viewmanagers.GlowViewManagerInterface

/** Fabric view manager of <GlowView>, on the codegen delegate and interface. */
@ReactModule(name = GlowViewManager.NAME)
class GlowViewManager : SimpleViewManager<GlowView>(), GlowViewManagerInterface<GlowView> {
  private val delegate = GlowViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<GlowView> = delegate

  override fun getName() = NAME

  override fun createViewInstance(context: ThemedReactContext): GlowView {
    val view = GlowView(context)
    view.onShaderError = { message ->
      val data = Arguments.createMap().apply { putString("message", message) }
      UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
          ?.dispatchEvent(ShaderErrorEvent(UIManagerHelper.getSurfaceId(context), view.id, data))
    }
    return view
  }

  override fun setGlowIntensity(view: GlowView, value: Float) {
    view.params = view.params.copy(intensity = value)
  }

  override fun setGlowOpacity(view: GlowView, value: Float) {
    view.params = view.params.copy(opacity = value)
  }

  override fun setGlowGrain(view: GlowView, value: Float) {
    view.params = view.params.copy(grain = value)
  }

  override fun setGlowGrainSize(view: GlowView, value: Float) {
    view.params = view.params.copy(grainSize = value)
  }

  override fun setGlowChroma(view: GlowView, value: Float) {
    view.params = view.params.copy(chroma = value)
  }

  override fun setGlowSoftness(view: GlowView, value: Float) {
    view.params = view.params.copy(softness = value)
  }

  override fun setGlowWidth(view: GlowView, value: Float) {
    view.params = view.params.copy(width = value)
  }

  override fun setGlowReach(view: GlowView, value: Float) {
    view.params = view.params.copy(reach = value)
  }

  override fun setGlowTopReach(view: GlowView, value: Float) {
    view.params = view.params.copy(topReach = value)
  }

  override fun setGlowDark(view: GlowView, value: Float) {
    view.params = view.params.copy(dark = value)
  }

  override fun setGlowSpreadX(view: GlowView, value: Float) {
    view.params = view.params.copy(spreadX = value)
  }

  override fun setGlowBalance(view: GlowView, value: Float) {
    view.params = view.params.copy(balance = value)
  }

  override fun setGlowContrast(view: GlowView, value: Float) {
    view.params = view.params.copy(contrast = value)
  }

  override fun setShowTop(view: GlowView, value: Boolean) = view.setShowTop(value)

  override fun setShowBottom(view: GlowView, value: Boolean) = view.setShowBottom(value)


  override fun setDelayMs(view: GlowView, value: Double) {
    view.delayMs = value
  }

  override fun onAfterUpdateTransaction(view: GlowView) {
    super.onAfterUpdateTransaction(view)
    view.applyProps()
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
      mapOf(EVENT_SHADER_ERROR to mapOf("registrationName" to "onShaderError"))

  private class ShaderErrorEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
      Event<ShaderErrorEvent>(surfaceId, viewId) {
    override fun getEventName() = EVENT_SHADER_ERROR
    override fun canCoalesce() = false
    override fun getEventData(): WritableMap = data
  }

  companion object {
    const val NAME = "GlowView"
    private const val EVENT_SHADER_ERROR = "topShaderError"
  }
}
