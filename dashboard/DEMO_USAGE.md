# vendVision Demo Dashboard - Usage Guide

## 🎯 Purpose

This is the **Demo Dashboard** - designed specifically for showing potential customers what vendVision can do during sales calls, presentations, and demos.

---

## 🚀 Quick Start

### 1. Start the System

```bash
# Start go2rtc (if not already running)
cd /Users/willleifker/src/vendVision
docker-compose up go2rtc -d

# Start the demo dashboard
cd web/vendvision-dashboard
npm run dev
```

### 2. Open in Browser

```
http://localhost:5173
```

---

## 📍 Machine Focus Feature

### **What It Does**

Allows sales people to zoom the camera into specific machines during demos by clicking buttons.

### **How to Use During a Demo**

**Example Zoom Call Scenario:**

1. **Start with overview:** Dashboard opens showing all machines (default view)
2. **Salesperson:** "Let me show you Machine 2 in detail..."
3. **Click:** Press the "🍫 Machine 2" button
4. **Result:** Camera instantly zooms to just Machine 2
5. **Customer:** "Wow, I can see everything clearly!"

### **Machine Selector Buttons**

Located below the camera view, you'll see:

```
📍 Quick Focus: Click to zoom into specific machines

[📹 All Machines] [🥤 Machine 1] [🍫 Machine 2] [🥗 Machine 3]
     (Active)
```

- **All Machines:** Full overview of demo center
- **Machine 1:** Focus on left machine
- **Machine 2:** Focus on center machine
- **Machine 3:** Focus on right machine

---

## 🔗 URL Parameters (Quick Links)

### **Create Direct Links to Specific Machines**

You can share URLs that automatically focus on a specific machine:

```
# Show all machines (default)
http://localhost:5173

# Auto-focus on Machine 1
http://localhost:5173?machine=1

# Auto-focus on Machine 2
http://localhost:5173?machine=2

# Auto-focus on Machine 3
http://localhost:5173?machine=3
```

**Use Case:** Email a prospect a link that goes straight to Machine 2

---

## ⚙️ Configuration

### **Machine Config File**

Location: `src/config/machine-config.json`

```json
{
  "machines": [
    {
      "id": "1",
      "name": "Machine 1",
      "description": "Left machine - Coca-Cola Freestyle",
      "stream": "tapo_machine_1",
      "icon": "🥤"
    }
  ]
}
```

### **Adjusting Machine Names**

Edit `machine-config.json` to:
- Change machine names
- Update descriptions
- Change icons
- Enable/disable machines

### **Adjusting Crop Positions**

Edit `go2rtc.yaml` to adjust the crop coordinates:

```yaml
tapo_machine_1:
  - ffmpeg:tapo_main#...crop=700:1000:50:40...
                          #     |    |   |  |
                          #     |    |   |  └─ Y position
                          #     |    |   └──── X position
                          #     |    └──────── Height
                          #     └───────────── Width
```

**After editing:** Restart go2rtc

```bash
docker-compose restart go2rtc
```

---

## 🎬 Demo Scenarios

### **Scenario 1: Zoom Sales Call**

**Setup:**
1. Start dashboard
2. Share screen in Zoom
3. Open `http://localhost:5173`

**During Call:**
- Start with "All Machines" view
- Click machine buttons as you present each one
- Customer sees instant zoom
- Professional and impressive!

### **Scenario 2: Trade Show Display**

**Setup:**
1. Large screen showing dashboard
2. URL: `http://localhost:5173?machine=all`
3. Auto-rotates through machines (future feature)

**During Show:**
- Visitors can see live camera feed
- Demonstrator clicks machines as needed
- Clear view of each machine's features

### **Scenario 3: Email Campaign**

**Setup:**
Send different prospects different machine views:

```
Subject: See our Coca-Cola Freestyle in action!
Link: http://demo.vendvision.com?machine=1

Subject: Check out our healthy vending options!
Link: http://demo.vendvision.com?machine=3
```

---

## 🛠️ Troubleshooting

### **Machine buttons don't work?**

1. Check that go2rtc is running: `docker-compose ps`
2. Verify machine streams exist in `go2rtc.yaml`
3. Restart go2rtc: `docker-compose restart go2rtc`

### **Camera not showing?**

1. Check go2rtc is accessible: `http://localhost:1984`
2. Verify camera connection: `http://localhost:1984/api/streams`
3. Check browser console for errors

### **Wrong machine showing?**

The crop coordinates in `go2rtc.yaml` may need adjustment. See "Adjusting Crop Positions" above.

---

## 📊 What's Mock Data vs Real?

**Current Demo Dashboard:**

| Feature | Status |
|---------|--------|
| Live Camera | ✅ Real (from actual camera) |
| Machine Focus | ✅ Real (actual crop/zoom) |
| Business Metrics | 📋 Mock (static data for demo) |
| Footfall | 📋 Mock |
| Touches | 📋 Mock |
| Vends | 📋 Mock |
| Sales | 📋 Mock |
| Charts | 📋 Mock |
| Active Ads | 📋 Mock |

**Why Mock Data?**

This is a **demo tool** for sales. The production dashboard will have real data from actual machines.

---

## 🎨 Customization for Demos

### **Change Machine Names for Specific Demos**

Edit `machine-config.json` before a demo:

```json
// For Coca-Cola demo
{
  "name": "Machine 1",
  "description": "Coca-Cola Freestyle - 100+ flavor combinations"
}

// For healthy vending demo
{
  "name": "Machine 3",
  "description": "Healthy Options - Organic snacks & drinks"
}
```

### **Adjust Business Metrics**

Edit `section-cards.tsx` to show impressive numbers for demos:

```tsx
<CardTitle>2,500</CardTitle>  // High traffic
<CardTitle>680</CardTitle>    // Good engagement
```

---

## 🔮 Future Features (Stage 2)

### **Visual Crop Configurator**

Coming soon: Draw boxes on the camera view to define machine positions

- No editing YAML files
- Drag and drop interface
- Live preview
- Save configurations

### **Demo Mode**

- Auto-cycle through machines every 10 seconds
- Presentation script overlay
- Guided tour mode

---

## 📝 Tips for Great Demos

1. **Practice first:** Click through all machines before the demo
2. **Start wide:** Begin with "All Machines" view
3. **Tell a story:** "Let me show you how customers interact..."
4. **Use descriptions:** Read the machine descriptions as you switch
5. **End with impact:** Show the business metrics cards

---

## 🔗 Related Documentation

- **Architecture Plan:** `/docs/DASHBOARD_ARCHITECTURE.md`
- **Product Requirements:** `/docs/PRODUCT_REQUIREMENTS.md`
- **Frontend Plan:** `/docs/FRONTEND_PLAN.md`

---

**Questions?** Check the main README or contact the dev team.

---

Last Updated: October 3, 2025

