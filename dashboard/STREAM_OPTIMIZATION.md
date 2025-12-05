# Stream Switching Optimization

## Problem
Original implementation had 3-5 second delays when switching between machine views because:
1. Each switch closed the existing WebRTC connection
2. Created a new RTCPeerConnection
3. Negotiated ICE candidates
4. Established a new connection
5. Waited for video frames

## Solution: Preloaded Streams

The optimized `camera-view-optimized.tsx` implements a **connection pooling** strategy:

### How It Works

1. **On Mount**: Initialize WebRTC connections for ALL machine streams
   - Each stream gets its own `RTCPeerConnection`
   - Each stream gets its own hidden `<video>` element
   - All connections stay alive in the background

2. **On Switch**: Just toggle CSS opacity
   - Current stream: `opacity: 1`, `z-index: 10`
   - Hidden streams: `opacity: 0`, `z-index: 1`
   - Transition takes ~300ms (CSS animation)

3. **Result**: ⚡ **Instant switching** (<300ms visual transition)

### Performance Characteristics

**Bandwidth Usage:**
- Old: 1 stream at a time (~4 Mbps)
- New: N streams simultaneously (~4N Mbps)
- For 3 machines: ~12 Mbps total

**CPU Usage:**
- Old: 1 video decoder
- New: N video decoders (one per stream)
- Modern browsers handle this efficiently with hardware acceleration

**Memory:**
- Old: ~50 MB per connection
- New: ~50N MB (150 MB for 3 streams)
- Negligible on modern systems

### Trade-offs

✅ **Pros:**
- Instant stream switching
- Smooth user experience
- No reconnection delays
- Better for demos

❌ **Cons:**
- Higher bandwidth usage
- More CPU for video decoding
- Not suitable for mobile/metered connections

### Configuration

To adjust the number of preloaded streams, modify `machine-config.json`:
- Streams listed in `machines` array are automatically preloaded
- Unused streams are cleaned up on component unmount

### Future Optimizations

Possible improvements:
1. **Lazy loading**: Only load streams on first access
2. **Smart preloading**: Preload only adjacent machines
3. **Quality adaptation**: Lower bitrate for background streams
4. **Canvas rendering**: Use single stream with client-side cropping

### Monitoring

Check browser console for logs:
```
🎥 Initializing stream: tapo_dewarped
✅ Stream ready: tapo_dewarped
🎬 Stream connected: tapo_dewarped
```

### Fallback

If this optimization causes issues, revert to original:
```typescript
// In App.tsx
import { CameraView } from "@/components/camera-view" // Original
// import { CameraView } from "@/components/camera-view-optimized" // Optimized
```















