# HireLink Draw.io Diagrams

This folder contains professional Draw.io diagrams for the HireLink academic project documentation.

## 📁 Available Diagrams

| File | Description | Diagram Type |
|------|-------------|--------------|
| `01_system_architecture.drawio` | High-level system architecture | Architecture Diagram |
| `02_context_dfd_level0.drawio` | Context Diagram (Level 0 DFD) | Data Flow Diagram |
| `03_dfd_level1.drawio` | Level 1 Data Flow Diagram | Data Flow Diagram |
| `04_dfd_level2_booking.drawio` | Level 2 DFD - Booking Management | Data Flow Diagram |
| `05_er_diagram.drawio` | Entity-Relationship Diagram | ER Diagram |
| `06_booking_status_flow.drawio` | Booking Status State Machine | State Diagram |
| `07_user_registration_workflow.drawio` | User Registration Flowchart | Flowchart |
| `08_booking_workflow.drawio` | Complete Booking Workflow | Sequence Diagram |
| `09_authentication_flow.drawio` | JWT Authentication Flow | Sequence Diagram |
| `10_deployment_architecture.drawio` | Deployment Architecture | Architecture Diagram |

## 🎨 How to Use

### Option 1: Draw.io Desktop App
1. Download Draw.io from https://www.diagrams.net/
2. Open any `.drawio` file
3. Edit if needed
4. Export: **File** → **Export as** → **PNG** (or PDF, SVG)

### Option 2: Draw.io Online
1. Go to https://app.diagrams.net/
2. Click **Open Existing Diagram**
3. Select the `.drawio` file from this folder
4. Export: **File** → **Export as** → **PNG**

### Option 3: VS Code Extension
1. Install **"Draw.io Integration"** extension
2. Open any `.drawio` file directly in VS Code
3. Right-click → **Export**

## 📤 Exporting for Word Document

### Recommended Settings:
- **Format:** PNG (best compatibility)
- **Resolution:** High (300 DPI for printing)
- **Background:** White (for printing)
- **Border:** 10px (optional padding)

### Steps:
1. Open diagram in Draw.io
2. **File** → **Export as** → **PNG...**
3. Settings:
   - Zoom: 200% (for high resolution)
   - Border Width: 10
   - Selection Only: Unchecked
   - Include a copy of my diagram: Unchecked
4. Click **Export**
5. Save to `docs/diagrams/images/` folder

## 📝 Inserting into Word

1. Open your Word document
2. Click where you want to insert the diagram
3. **Insert** → **Pictures** → **This Device**
4. Select the exported PNG
5. **Right-click image** → **Insert Caption**
   - Example: "Figure 5.1: Level 1 Data Flow Diagram"
6. Resize if needed (recommended: 6" width)

## 🎨 Color Scheme Used

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #4F46E5 | Main processes, user management |
| Green | #10B981 | Customer entities, success states |
| Orange | #F59E0B | Provider entities, booking processes |
| Red | #EF4444 | Admin, errors, cancelled states |
| Purple | #8B5CF6 | Review system, in-progress states |
| Yellow | #FEF3C7 | Pending/warning states, decisions |

## ✏️ Editing Tips

1. **To change colors:** Select shape → Right panel → Fill color
2. **To resize:** Drag corner handles
3. **To add labels:** Double-click on arrows
4. **To align:** Select multiple → Arrange → Align
5. **To group:** Select multiple → Right-click → Group

## 📦 Batch Export Script

If you have Node.js installed, you can batch export using draw.io CLI:

```bash
# Install draw.io desktop first, then:
for file in *.drawio; do
    drawio --export --format png --output "images/${file%.drawio}.png" "$file"
done
```

---

**Note:** These diagrams are designed to be professional and print-ready for academic submissions.
