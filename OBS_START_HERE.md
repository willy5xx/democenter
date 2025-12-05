# 🚀 OBS Setup - 2 Minute Start

## Installation (One Time Only)

### 1. Install OBS
```bash
# Download and install from:
https://obsproject.com
```

### 2. Run Auto-Setup
```bash
cd /path/to/demo-center
./setup-obs.sh
```

**That's it!** OBS is now configured. ✅

---

## Using in Zoom (Every Demo)

### Quick 4-Step Process:

```bash
# 1. Start vendVision
./start-dev.sh

# 2. Launch OBS
# (You'll see "vendVision Demo" scene)

# 3. Click "Start Virtual Camera" in OBS

# 4. In Zoom: Settings → Video → Select "OBS Virtual Camera"
```

**Done!** vendVision now appears as your camera in Zoom. 🎥

---

## Alternative: Use Dashboard UI

```
1. Open http://localhost:5173/admin
2. Click "OBS Setup" tab
3. Click "Auto-Configure OBS" button
4. Follow on-screen instructions
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "OBS not found" | Install from https://obsproject.com |
| "Black screen" | Make sure vendVision is running (`./start-dev.sh`) |
| "Not in Zoom" | Restart Zoom after starting Virtual Camera |
| "Setup fails" | Close OBS first, then run `./setup-obs.sh` again |

---

## Files to Remember

- `./setup-obs.sh` - Run this to configure OBS
- `OBS_AUTO_SETUP.md` - Full documentation
- `OBS_QUICK_REFERENCE.md` - Command reference
- `/admin` page - UI configuration option

---

## Pro Tips

✅ **Test before demos** - Open Zoom settings and verify camera  
✅ **Keep OBS open** - Don't close during calls  
✅ **Use wired internet** - More stable than WiFi  
✅ **Practice switching** - Know your camera buttons  

---

**Questions?** Check `OBS_AUTO_SETUP.md` for comprehensive guide.

**Ready to demo!** 🎉

