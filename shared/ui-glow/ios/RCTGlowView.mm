// RCTGlowView: <GlowView> on iOS. Draws glow.msl with Metal in an MTKView, which has its own
// display loop, so no JS runs per frame.
//
// Flow: React sets the props (updateProps) → the fades start (GlowFade) → on each frame,
// drawInMTKView sends the uniforms to the shader. The shader compiles once per app run.
// The top and bottom glows fade in or out after `delayMs`. The whole glow fades in once the
// shader is ready. Reduce motion stops the clock and makes fades instant. Pixel ratio capped at 2.
//
// Reading Objective-C++ as a JS dev: `[object method:arg]` is `object.method(arg)`, `_name` is a
// field of this view (`this.name`), and `^(args) { … }` is a block (an arrow function).

#import "RCTGlowView.h"

#import <MetalKit/MetalKit.h>

#import <react/renderer/components/SharedUiGlowSpec/ComponentDescriptors.h>
#import <react/renderer/components/SharedUiGlowSpec/EventEmitters.h>
#import <react/renderer/components/SharedUiGlowSpec/Props.h>
#import <react/renderer/components/SharedUiGlowSpec/RCTComponentViewHelpers.h>

#include <algorithm>

using namespace facebook::react;

static const CGFloat kMaxPixelRatio = 2.0;
static const double kFadeSeconds = 1.0; // one glow coming or going (GLOW_FADE_MS in JS)
static const double kEntryFadeSeconds = 0.6; // the first display, once the shader is ready
// The most one frame moves the clock: after the background or a long freeze, the glow does not jump.
static const double kMaxFrameSeconds = 0.1;

#pragma mark - Uniforms: the values sent to the shader on each frame

// Same fields, same order as `Uniforms` in glow.msl (96 bytes).
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

#pragma mark - Shader: compiled once per app run

// The GPU, or nil when Metal is not available.
static id<MTLDevice> GlowDevice(void)
{
  static id<MTLDevice> device;
  static dispatch_once_t once;
  dispatch_once(&once, ^{ device = MTLCreateSystemDefaultDevice(); });
  return device;
}

// The Metal source in the pod's resource bundle. Not `.metal`: Xcode 26 would compile it at build
// time, which needs the separate Metal Toolchain download on every machine and CI runner.
static NSString *GlowShaderSource(void)
{
  NSBundle *podBundle = [NSBundle bundleForClass:[RCTGlowView class]];
  NSURL *bundleURL = [podBundle URLForResource:@"SharedUiGlow" withExtension:@"bundle"];
  NSURL *url = bundleURL ? [[NSBundle bundleWithURL:bundleURL] URLForResource:@"glow" withExtension:@"msl"] : nil;
  return url ? [NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:nil] : nil;
}

// Gets the pipeline (the compiled GPU program), or an error message.
typedef void (^GlowPipelineHandler)(id<MTLRenderPipelineState> _Nullable pipeline, NSString *_Nullable error);

// Compiles glow.msl into a pipeline. Metal compiles on its own thread: `handler` may run on any thread.
static void GlowCompilePipeline(GlowPipelineHandler handler)
{
  if (!GlowDevice()) {
    handler(nil, @"Metal is not available on this device");
    return;
  }
  NSString *source = GlowShaderSource();
  if (!source) {
    handler(nil, @"Shader not found: SharedUiGlow.bundle/glow.msl");
    return;
  }
  [GlowDevice() newLibraryWithSource:source
                             options:[MTLCompileOptions new]
                   completionHandler:^(id<MTLLibrary> library, NSError *compileError) {
                     if (!library) {
                       handler(nil, [NSString stringWithFormat:@"Metal error: %@", compileError.localizedDescription]);
                       return;
                     }
                     MTLRenderPipelineDescriptor *desc = [MTLRenderPipelineDescriptor new];
                     desc.vertexFunction = [library newFunctionWithName:@"glow_vertex"];
                     desc.fragmentFunction = [library newFunctionWithName:@"glow_fragment"];
                     desc.colorAttachments[0].pixelFormat = MTLPixelFormatBGRA8Unorm;
                     NSError *pipelineError = nil;
                     id<MTLRenderPipelineState> pipeline =
                         [GlowDevice() newRenderPipelineStateWithDescriptor:desc error:&pipelineError];
                     handler(pipeline,
                             pipeline ? nil
                                      : [NSString stringWithFormat:@"Metal error: %@", pipelineError.localizedDescription]);
                   }];
}

// Main thread only. Gives the pipeline to `handler`, and compiles it on the first call only.
// Views that ask during the compile wait for the same result. `handler` always runs later, on the
// main thread: during the first updateProps, the view cannot send events yet.
static void GlowLoadPipeline(GlowPipelineHandler handler)
{
  static id<MTLRenderPipelineState> pipeline; // set once compiled
  static NSString *error; // set if the compile failed
  static NSMutableArray<GlowPipelineHandler> *waiting; // not nil while compiling

  if (pipeline || error) {
    dispatch_async(dispatch_get_main_queue(), ^{ handler(pipeline, error); });
    return;
  }
  if (waiting) {
    [waiting addObject:[handler copy]];
    return;
  }
  waiting = [NSMutableArray arrayWithObject:[handler copy]];
  GlowCompilePipeline(^(id<MTLRenderPipelineState> newPipeline, NSString *newError) {
    dispatch_async(dispatch_get_main_queue(), ^{
      pipeline = newPipeline;
      error = newError;
      for (GlowPipelineHandler waitingHandler in waiting) {
        waitingHandler(pipeline, error);
      }
      waiting = nil;
    });
  });
}

#pragma mark - Fade: the opacity of one glow

// Moves from 0 (hidden) to 1 (shown) or back in kFadeSeconds, after an optional wait.
// Linear: the shader eases it.
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

  // Jump to the target (reduce motion was turned on).
  void finish()
  {
    value = from = target;
    start = 0;
  }

  // Once per frame. Returns true while the fade waits or runs.
  bool step(CFTimeInterval now)
  {
    if (start == 0) {
      return false;
    }
    double progress = std::clamp((now - start) / kFadeSeconds, 0.0, 1.0); // 0 while waiting
    value = from + (target - from) * (float)progress;
    if (progress >= 1) {
      start = 0;
    }
    return true;
  }
};

#pragma mark - The view

@interface RCTGlowView () <RCTGlowViewViewProtocol, MTKViewDelegate>
@end

@implementation RCTGlowView {
  MTKView *_mtkView;
  id<MTLCommandQueue> _queue;
  id<MTLRenderPipelineState> _pipeline; // the compiled shader; nil while loading or after an error
  BOOL _hasAskedForPipeline;
  GlowUniforms _params; // only the design params; the rest is filled on each frame
  double _elapsedSeconds; // the shader clock
  CFTimeInterval _lastFrameTime; // 0 = no frame yet: the next one does not move the clock
  BOOL _hasProps; // false until the first props: the first show is instant
  GlowFade _top;
  GlowFade _bottom;
  CFTimeInterval _readyTime; // when the shader was ready, for the entry fade; 0 = not yet
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
  _hasAskedForPipeline = NO;
  _params = {};
  _elapsedSeconds = 0;
  _lastFrameTime = 0;
  _hasProps = NO;
  _top = GlowFade();
  _bottom = GlowFade();
  _readyTime = 0;
}

// Fabric reuses views: a recycled view starts again from zero.
- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self resetState];
}

// The user turned reduce motion on or off. A paused MTKView draws nothing, so wake it.
- (void)reduceMotionDidChange
{
  if (UIAccessibilityIsReduceMotionEnabled()) {
    _top.finish();
    _bottom.finish();
  }
  _lastFrameTime = 0;
  _mtkView.paused = NO;
}

#pragma mark Props from React

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<GlowViewProps const>(props);
  [self copyDesignParams:newProps];
  [self showTop:newProps.showTop bottom:newProps.showBottom afterMs:newProps.delayMs];
  [super updateProps:props oldProps:oldProps];
  [self loadPipelineOnce];
}

- (void)copyDesignParams:(const GlowViewProps &)newProps
{
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
}

// The first props show at once. A later change waits `delayMs`, then fades.
- (void)showTop:(BOOL)showTop bottom:(BOOL)showBottom afterMs:(double)delayMs
{
  bool isInstant = !_hasProps || UIAccessibilityIsReduceMotionEnabled();
  _hasProps = YES;
  CFTimeInterval start = CACurrentMediaTime() + delayMs / 1000.0;
  _top.setTarget(showTop ? 1 : 0, start, isInstant);
  _bottom.setTarget(showBottom ? 1 : 0, start, isInstant);
  _mtkView.paused = NO; // a still glow (reduce motion) needs a new frame
}

- (void)loadPipelineOnce
{
  if (_hasAskedForPipeline) {
    return;
  }
  _hasAskedForPipeline = YES;
  __weak RCTGlowView *weakSelf = self; // the view may be gone when the shader is ready
  GlowLoadPipeline(^(id<MTLRenderPipelineState> pipeline, NSString *error) {
    [weakSelf pipelineDidLoad:pipeline error:error];
  });
}

- (void)pipelineDidLoad:(id<MTLRenderPipelineState>)pipeline error:(NSString *)error
{
  if (!_hasAskedForPipeline) {
    return; // recycled while the shader compiled
  }
  _pipeline = pipeline;
  _readyTime = CACurrentMediaTime();
  _mtkView.paused = NO;
  if (error && _eventEmitter) {
    std::static_pointer_cast<const GlowViewEventEmitter>(_eventEmitter)
        ->onShaderError(GlowViewEventEmitter::OnShaderError{.message = std::string(error.UTF8String)});
  }
}

#pragma mark Drawing

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  CGFloat screenScale = self.window ? self.window.screen.scale : self.traitCollection.displayScale;
  _mtkView.contentScaleFactor = MIN(MAX(screenScale, 1), kMaxPixelRatio);
  _lastFrameTime = 0; // hidden time does not move the clock
}

- (void)mtkView:(MTKView *)view drawableSizeWillChange:(CGSize)size
{
  view.paused = NO; // a still glow (reduce motion) draws once at the new size, then pauses again
}

// MTKView calls this for each frame.
- (void)drawInMTKView:(MTKView *)view
{
  CFTimeInterval now = CACurrentMediaTime();
  BOOL isReduceMotion = UIAccessibilityIsReduceMotionEnabled();
  [self moveClock:now isReduceMotion:isReduceMotion];
  BOOL isTopFading = _top.step(now);
  BOOL isBottomFading = _bottom.step(now);
  BOOL isEntering = _readyTime > 0 && now - _readyTime < kEntryFadeSeconds;
  // A still glow (reduce motion) stops the loop once nothing moves. New props start it again.
  view.paused = isReduceMotion && !isTopFading && !isBottomFading && !isEntering && _pipeline != nil;
  [self drawFrameIn:view now:now isReduceMotion:isReduceMotion];
}

// Reduce motion stops the clock: the glow stays still.
- (void)moveClock:(CFTimeInterval)now isReduceMotion:(BOOL)isReduceMotion
{
  if (_lastFrameTime > 0 && !isReduceMotion) {
    _elapsedSeconds += std::min(now - _lastFrameTime, kMaxFrameSeconds);
  }
  _lastFrameTime = now;
}

- (void)drawFrameIn:(MTKView *)view now:(CFTimeInterval)now isReduceMotion:(BOOL)isReduceMotion
{
  MTLRenderPassDescriptor *pass = view.currentRenderPassDescriptor;
  id<CAMetalDrawable> drawable = view.currentDrawable;
  if (!pass || !drawable) {
    return;
  }
  id<MTLCommandBuffer> commands = [_queue commandBuffer];
  id<MTLRenderCommandEncoder> encoder = [commands renderCommandEncoderWithDescriptor:pass]; // clears to black
  if (_pipeline) {
    GlowUniforms uniforms = [self uniformsFor:view now:now isReduceMotion:isReduceMotion];
    [encoder setRenderPipelineState:_pipeline];
    [encoder setVertexBytes:&uniforms length:sizeof(uniforms) atIndex:0];
    [encoder setFragmentBytes:&uniforms length:sizeof(uniforms) atIndex:0];
    [encoder drawPrimitives:MTLPrimitiveTypeTriangle vertexStart:0 vertexCount:3]; // one big triangle covers the view
  }
  [encoder endEncoding];
  [commands presentDrawable:drawable];
  [commands commit];
}

// This frame's values: the design params from props, plus the size, the clock and the fades.
- (GlowUniforms)uniformsFor:(MTKView *)view now:(CFTimeInterval)now isReduceMotion:(BOOL)isReduceMotion
{
  GlowUniforms uniforms = _params;
  uniforms.res[0] = (float)view.drawableSize.width;
  uniforms.res[1] = (float)view.drawableSize.height;
  uniforms.time = (float)_elapsedSeconds;
  uniforms.dpr = (float)view.contentScaleFactor;
  uniforms.fade = isReduceMotion ? 1 : (float)std::min(1.0, (now - _readyTime) / kEntryFadeSeconds);
  uniforms.fadeTop = _top.value;
  uniforms.fadeBottom = _bottom.value;
  return uniforms;
}

@end
