// RCTGlowView: Fabric view for <GlowView>, drawn with Metal in an MTKView (its own display
// loop, paused off-window), so no JS runs per frame. The shader is glow.msl, shipped with the app
// and compiled once per app run. Two glows (top, bottom) fade in or out after `delayMs`; the whole
// glow fades in once the shader is ready. Reduce motion stops the clock and makes fades instant.
// Pixel ratio capped at 2.

#import "RCTGlowView.h"

#import <MetalKit/MetalKit.h>

#import <react/renderer/components/SharedUiGlowSpec/ComponentDescriptors.h>
#import <react/renderer/components/SharedUiGlowSpec/EventEmitters.h>
#import <react/renderer/components/SharedUiGlowSpec/Props.h>
#import <react/renderer/components/SharedUiGlowSpec/RCTComponentViewHelpers.h>

#include <algorithm>

using namespace facebook::react;

static const CGFloat kMaxPixelRatio = 2.0;
static const double kFade = 1.0; // seconds, one glow coming or going (GLOW_FADE_MS in JS)
static const double kEntryFade = 0.6; // the first display, once the shader is ready

// Same layout as `Uniforms` in glow.msl (96 bytes).
typedef struct {
  float res[2];
  float time;
  float dpr;
  float fade;
  float fadeTop;
  float fadeBottom;
  float pad;
  // The design params (GlowParams), filled by name from the typed props.
  float intensity;
  float opacity;
  float grain;
  float grainSize;
  float chroma;
  float softness;
  float width;
  float reach;
  float dark;
  float spreadX;
  float balance;
  float contrast;
  float topReach;
  float pad2[3];
} GlowUniforms;
static_assert(sizeof(GlowUniforms) == 96, "must match `Uniforms` in glow.msl");

static id<MTLDevice> GlowDevice(void)
{
  static id<MTLDevice> device;
  static dispatch_once_t once;
  dispatch_once(&once, ^{ device = MTLCreateSystemDefaultDevice(); });
  return device;
}

typedef void (^GlowPipelineHandler)(id<MTLRenderPipelineState> _Nullable pipeline, NSString *_Nullable error);

// The Metal source in the pod's resource bundle. Not `.metal`: Xcode 26 would compile it at build
// time, which needs the separate Metal Toolchain download on every machine and CI runner.
static NSString *GlowShaderSource(void)
{
  NSBundle *podBundle = [NSBundle bundleForClass:[RCTGlowView class]];
  NSURL *bundleURL = [podBundle URLForResource:@"SharedUiGlow" withExtension:@"bundle"];
  NSURL *url = bundleURL ? [[NSBundle bundleWithURL:bundleURL] URLForResource:@"glow" withExtension:@"msl"] : nil;
  return url ? [NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:nil] : nil;
}

// Main thread only. Compiles the shader once per process, off the main thread. Results always
// arrive async: during the first updateProps the event emitter is not set yet.
static void GlowPipeline(GlowPipelineHandler handler)
{
  static id done; // pipeline | error string
  static NSMutableArray<GlowPipelineHandler> *pending;
  if (done) {
    BOOL isError = [done isKindOfClass:[NSString class]];
    id result = done;
    dispatch_async(dispatch_get_main_queue(), ^{
      handler(isError ? nil : result, isError ? result : nil);
    });
    return;
  }
  if (pending) {
    [pending addObject:[handler copy]];
    return;
  }
  pending = [NSMutableArray arrayWithObject:[handler copy]];
  void (^finish)(id<MTLRenderPipelineState>, NSString *) = ^(id<MTLRenderPipelineState> pipeline, NSString *error) {
    dispatch_async(dispatch_get_main_queue(), ^{
      done = pipeline ?: error;
      for (GlowPipelineHandler h in pending) {
        h(pipeline, error);
      }
      pending = nil;
    });
  };
  if (!GlowDevice()) {
    finish(nil, @"Metal is not available on this device");
    return;
  }
  NSString *source = GlowShaderSource();
  if (!source) {
    finish(nil, @"Shader not found: SharedUiGlow.bundle/glow.msl");
    return;
  }
  [GlowDevice() newLibraryWithSource:source
                             options:[MTLCompileOptions new]
                   completionHandler:^(id<MTLLibrary> library, NSError *compileError) {
                     NSError *pipelineError = nil;
                     id<MTLRenderPipelineState> pipeline = nil;
                     if (library) {
                       MTLRenderPipelineDescriptor *desc = [MTLRenderPipelineDescriptor new];
                       desc.vertexFunction = [library newFunctionWithName:@"glow_vertex"];
                       desc.fragmentFunction = [library newFunctionWithName:@"glow_fragment"];
                       desc.colorAttachments[0].pixelFormat = MTLPixelFormatBGRA8Unorm;
                       pipeline = [GlowDevice() newRenderPipelineStateWithDescriptor:desc error:&pipelineError];
                     }
                     finish(pipeline,
                            pipeline ? nil
                                     : [NSString stringWithFormat:@"Metal error: %@",
                                                                  (compileError ?: pipelineError).localizedDescription]);
                   }];
}

// The opacity of one glow, faded toward a target after an optional wait.
struct GlowFade {
  float value = 0;
  float from = 0;
  float target = 0;
  CFTimeInterval start = 0; // 0 = not fading

  void setTarget(float newTarget, CFTimeInterval at, bool isInstant)
  {
    if (isInstant) {
      value = from = target = newTarget;
      start = 0;
    } else if (newTarget != target) {
      from = value;
      target = newTarget;
      start = at;
    }
  }

  // Jump to the target (reduce motion).
  void finish()
  {
    value = from = target;
    start = 0;
  }

  // Returns true while the fade waits or runs.
  bool step(CFTimeInterval now)
  {
    if (start == 0) {
      return false;
    }
    double progress = std::clamp((now - start) / kFade, 0.0, 1.0);
    value = from + (target - from) * (float)progress;
    if (progress >= 1) {
      start = 0;
    }
    return true;
  }
};

@interface RCTGlowView () <RCTGlowViewViewProtocol, MTKViewDelegate>
@end

@implementation RCTGlowView {
  MTKView *_mtkView;
  id<MTLCommandQueue> _queue;
  id<MTLRenderPipelineState> _pipeline; // nil while loading or after an error
  BOOL _hasPipelineRequest;
  GlowUniforms _params; // only the design params are used
  double _elapsed; // seconds, double precision
  CFTimeInterval _lastFrame; // 0 = no frame yet
  BOOL _hasShown; // false until the first props: the first visibility shows at once
  GlowFade _top;
  GlowFade _bottom;
  CFTimeInterval _entryStart; // 0 = shader not ready yet
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<GlowViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const GlowViewProps>();
    _props = defaultProps;
    _queue = [GlowDevice() newCommandQueue];
    _mtkView = [[MTKView alloc] initWithFrame:self.bounds device:GlowDevice()];
    _mtkView.colorPixelFormat = MTLPixelFormatBGRA8Unorm;
    _mtkView.clearColor = MTLClearColorMake(0, 0, 0, 1);
    _mtkView.delegate = self;
    self.contentView = _mtkView;
    [self resetState];
    // Selector observers are removed by the system when the view is freed.
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(reduceMotionDidChange)
                                                 name:UIAccessibilityReduceMotionStatusDidChangeNotification
                                               object:nil];
  }
  return self;
}

- (void)resetState
{
  _pipeline = nil;
  _hasPipelineRequest = NO;
  _params = {};
  _elapsed = 0;
  _lastFrame = 0;
  _hasShown = NO;
  _top = GlowFade();
  _bottom = GlowFade();
  _entryStart = 0;
}

// A paused MTKView never calls drawInMTKView, so wake it here to pick up the new setting.
- (void)reduceMotionDidChange
{
  if (UIAccessibilityIsReduceMotionEnabled()) {
    _top.finish();
    _bottom.finish();
  }
  _lastFrame = 0;
  _mtkView.paused = NO;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self resetState];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<GlowViewProps const>(props);
  _params.intensity = newProps.glowIntensity;
  _params.opacity = newProps.glowOpacity;
  _params.grain = newProps.glowGrain;
  _params.grainSize = newProps.glowGrainSize;
  _params.chroma = newProps.glowChroma;
  _params.softness = newProps.glowSoftness;
  _params.width = newProps.glowWidth;
  _params.reach = newProps.glowReach;
  _params.dark = newProps.glowDark;
  _params.spreadX = newProps.glowSpreadX;
  _params.balance = newProps.glowBalance;
  _params.contrast = newProps.glowContrast;
  _params.topReach = newProps.glowTopReach;
  BOOL isInstant = !_hasShown || UIAccessibilityIsReduceMotionEnabled();
  _hasShown = YES;
  CFTimeInterval start = CACurrentMediaTime() + newProps.delayMs / 1000.0;
  _top.setTarget(newProps.showTop ? 1 : 0, start, isInstant);
  _bottom.setTarget(newProps.showBottom ? 1 : 0, start, isInstant);
  _mtkView.paused = NO;
  [super updateProps:props oldProps:oldProps];
  if (_hasPipelineRequest) {
    return;
  }
  _hasPipelineRequest = YES;
  __weak RCTGlowView *weakSelf = self;
  GlowPipeline(^(id<MTLRenderPipelineState> pipeline, NSString *error) {
    RCTGlowView *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf->_hasPipelineRequest) {
      return;
    }
    strongSelf->_pipeline = pipeline;
    strongSelf->_entryStart = CACurrentMediaTime();
    strongSelf->_mtkView.paused = NO;
    if (error && strongSelf->_eventEmitter) {
      std::static_pointer_cast<const GlowViewEventEmitter>(strongSelf->_eventEmitter)
          ->onShaderError(GlowViewEventEmitter::OnShaderError{.message = std::string(error.UTF8String)});
    }
  });
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  CGFloat screenScale = self.window ? self.window.screen.scale : self.traitCollection.displayScale;
  _mtkView.contentScaleFactor = MIN(MAX(screenScale, 1), kMaxPixelRatio);
  _lastFrame = 0; // hidden time does not move the clock
}

- (void)mtkView:(MTKView *)view drawableSizeWillChange:(CGSize)size
{
  view.paused = NO; // a still glow (reduce motion) draws once at the new size, then pauses again
}

- (void)drawInMTKView:(MTKView *)view
{
  CFTimeInterval now = CACurrentMediaTime();
  BOOL isReduceMotion = UIAccessibilityIsReduceMotionEnabled();
  if (_lastFrame > 0 && !isReduceMotion) {
    _elapsed += now - _lastFrame;
  }
  _lastFrame = now;
  BOOL isTopFading = _top.step(now);
  BOOL isBottomFading = _bottom.step(now);
  BOOL isEntering = _entryStart > 0 && now - _entryStart < kEntryFade;
  // A still glow (reduce motion) only draws again when its props change.
  view.paused = isReduceMotion && !isTopFading && !isBottomFading && !isEntering && _pipeline;

  MTLRenderPassDescriptor *pass = view.currentRenderPassDescriptor;
  id<CAMetalDrawable> drawable = view.currentDrawable;
  if (!pass || !drawable) {
    return;
  }
  id<MTLCommandBuffer> cmd = [_queue commandBuffer];
  id<MTLRenderCommandEncoder> enc = [cmd renderCommandEncoderWithDescriptor:pass]; // clears to black
  if (_pipeline) {
    CGSize size = view.drawableSize;
    GlowUniforms u = _params;
    u.res[0] = (float)size.width;
    u.res[1] = (float)size.height;
    u.time = (float)_elapsed;
    u.dpr = (float)view.contentScaleFactor;
    u.fade = isReduceMotion ? 1 : (float)std::min(1.0, (now - _entryStart) / kEntryFade);
    u.fadeTop = _top.value;
    u.fadeBottom = _bottom.value;
    [enc setRenderPipelineState:_pipeline];
    [enc setVertexBytes:&u length:sizeof(u) atIndex:0];
    [enc setFragmentBytes:&u length:sizeof(u) atIndex:0];
    [enc drawPrimitives:MTLPrimitiveTypeTriangle vertexStart:0 vertexCount:3];
  }
  [enc endEncoding];
  [cmd presentDrawable:drawable];
  [cmd commit];
}

@end
