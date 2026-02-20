# Document Conversion Instructions

## Converting HireLink_Academic_Project_Documentation.md to Word/PDF

The comprehensive documentation has been created in Markdown format. Here are several ways to convert it to Word (.docx) or PDF format:

---

## Option 1: Using Pandoc (Recommended)

### Install Pandoc
- **Windows**: Download from https://pandoc.org/installing.html or use `winget install pandoc`
- **macOS**: `brew install pandoc`
- **Linux**: `sudo apt-get install pandoc`

### Convert to Word (.docx)
```bash
cd docs
pandoc HireLink_Academic_Project_Documentation.md -o HireLink_Academic_Project_Documentation.docx --toc --toc-depth=3
```

### Convert to PDF (requires LaTeX)
```bash
pandoc HireLink_Academic_Project_Documentation.md -o HireLink_Academic_Project_Documentation.pdf --toc --toc-depth=3
```

### For better formatting, use a reference document:
```bash
pandoc HireLink_Academic_Project_Documentation.md -o HireLink_Academic_Project_Documentation.docx --reference-doc=template.docx
```

---

## Option 2: Using Microsoft Word

1. Open Microsoft Word
2. Go to **File** → **Open**
3. Change file type filter to "All Files (*.*)"
4. Select `HireLink_Academic_Project_Documentation.md`
5. Word will convert it automatically
6. Format as needed and save as .docx
7. Export to PDF via **File** → **Export** → **Create PDF/XPS**

---

## Option 3: Using VS Code

1. Install the "Markdown PDF" extension in VS Code
2. Open the .md file
3. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
4. Type "Markdown PDF: Export (PDF)" or "Markdown PDF: Export (word)"
5. The file will be generated in the same directory

---

## Option 4: Online Converters

1. **Dillinger.io** - https://dillinger.io/
   - Paste markdown content
   - Export as PDF or HTML

2. **CloudConvert** - https://cloudconvert.com/md-to-docx
   - Upload the .md file
   - Download .docx output

3. **Convertio** - https://convertio.co/md-docx/
   - Upload and convert online

---

## Post-Conversion Formatting Tips

After converting to Word, you may want to:

1. **Add Title Page**: Create a professional cover page with:
   - University logo
   - Project title
   - Student names
   - Supervisor name
   - Submission date

2. **Update Table of Contents**: Right-click on TOC → Update Field → Update Entire Table

3. **Fix Diagram Formatting**: The ASCII diagrams may need manual adjustment or replacement with proper images

4. **Apply Academic Styles**:
   - Use proper heading styles (Heading 1, 2, 3)
   - Set consistent fonts (Times New Roman 12pt for body)
   - Adjust margins (1 inch all around)
   - Add page numbers
   - Add headers/footers

5. **Add Appendices**:
   - Include actual screenshots
   - Add code samples with syntax highlighting
   - Include database schema images

---

## Creating Professional Diagrams

For better visual diagrams, consider using:

1. **Lucidchart** - https://www.lucidchart.com/
2. **Draw.io** - https://app.diagrams.net/
3. **Microsoft Visio**
4. **PlantUML** - For generating diagrams from text

The ER diagram in `Reference/DatbaseStruct/HireLink_ER_Diagram.mermaid` can be rendered using:
- https://mermaid.live/
- VS Code Mermaid extension
- Export as PNG/SVG and insert into document

---

## Document Structure Summary

The documentation includes:

| Section | Description |
|---------|-------------|
| Executive Summary | Project overview and highlights |
| Introduction | Problem statement and scope |
| SRS | Functional and non-functional requirements |
| System Architecture | High-level and component architecture |
| DFD | Level 0, 1, and 2 data flow diagrams |
| ER Diagrams | Complete entity-relationship diagram |
| Database Design | Schema, data dictionary, state machines |
| Workflow Diagrams | Registration, booking, onboarding flows |
| Technical Specs | Frontend and backend specifications |
| API Documentation | Endpoint details with examples |
| UI Design | Layout structures and wireframes |
| Security | Authentication and authorization |
| Testing | Strategy and sample test cases |
| Deployment | Docker and infrastructure setup |
| Conclusion | Summary and future enhancements |

---

Happy converting! 🎓
