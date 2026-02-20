# HireLink Diagrams

This folder contains Mermaid diagram source files (`.mmd`) for the HireLink project documentation.

## Diagram Files

| File | Description |
|------|-------------|
| `01_system_architecture.mmd` | High-level system architecture |
| `02_context_dfd_level0.mmd` | Context Diagram (Level 0 DFD) |
| `03_dfd_level1.mmd` | Level 1 Data Flow Diagram |
| `04_dfd_level2_booking.mmd` | Level 2 DFD - Booking Management |
| `05_er_diagram.mmd` | Entity-Relationship Diagram |
| `06_booking_status_flow.mmd` | Booking Status State Machine |
| `07_user_registration_workflow.mmd` | User Registration Flowchart |
| `08_booking_workflow.mmd` | Service Booking Sequence Diagram |
| `09_authentication_flow.mmd` | JWT Authentication Flow |
| `10_deployment_architecture.mmd` | Deployment Architecture |

## How to Render Diagrams

### Option 1: Online (Easiest - No Installation)

1. Go to **https://mermaid.live/**
2. Open each `.mmd` file and copy its contents
3. Paste into the editor on the left
4. The diagram renders automatically on the right
5. Click **"Actions"** → **"Download PNG"** or **"Download SVG"**
6. Save to `docs/diagrams/images/` folder
7. Insert images into your Word document

### Option 2: Command Line (Batch Rendering)

1. Install Mermaid CLI:
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

2. Run the render script:
   ```powershell
   cd docs/diagrams
   .\render-diagrams.ps1
   ```

3. Images will be saved to `docs/diagrams/images/`

### Option 3: VS Code Extension

1. Install **"Markdown Preview Mermaid Support"** extension
2. Open any `.mmd` file
3. Right-click → **"Mermaid: Export to PNG"**

## Inserting Images into Word

1. Open your Word document
2. Place cursor where you want the diagram
3. Go to **Insert** → **Pictures** → **This Device**
4. Select the PNG file from `docs/diagrams/images/`
5. Resize as needed (recommended: 6 inches width)
6. Add a caption: Right-click image → **Insert Caption**

## Tips for Best Quality

- Use PNG for documents (better quality)
- Use SVG for web/presentations (scalable)
- Set width to 1200px for high-resolution output
- White background works best for printing
