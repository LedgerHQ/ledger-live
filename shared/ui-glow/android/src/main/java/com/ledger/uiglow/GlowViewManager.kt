package com.ledger.uiglow

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
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

  override fun setSource(view: GlowView, value: String?) {
    view.source = value ?: ""
  }

  override fun setParams(view: GlowView, value: ReadableArray?) {
    val values = FloatArray(GlowView.PARAM_COUNT)
    val count = minOf(value?.size() ?: 0, GlowView.PARAM_COUNT)
    for (i in 0 until count) values[i] = value!!.getDouble(i).toFloat()
    view.params = values
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
