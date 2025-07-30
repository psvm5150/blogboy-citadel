# Blogboy Citadel

> Return your posts to me and I myself will carry you through the gates of Valhalla.  
> 🧴💨 You will code eternal, shiny and RESTful! 

A lightweight and simple blog management system for GitHub Pages blogs. Built as an alternative to Jekyll when design configuration became too complex and cumbersome.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://tansan5150.github.io)
[![License](https://img.shields.io/badge/License-CC%20BY%202.0-lightgrey.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## Features

- **Pure web technologies**: Built with HTML, CSS, and JavaScript without Jekyll
- **GitHub Pages compatible**: Uses `.nojekyll` file for static site hosting
- **Dynamic markdown rendering**: Real-time document loading from local markdown files
- **Responsive design**: Works seamlessly across all devices
- **Lightweight and simple**: A minimalist blog management system for easy content organization

## Site Structure
```
blogboy-citadel/
├── 📁 css/
│   ├── 🎨 main.css           # Main page styles
│   └── 🎨 viewer.css         # Viewer page styles
├── 📁 js/
│   ├── ⚡ main.js            # Main page logic
│   └── ⚡ viewer.js          # Viewer page logic
├── 📁 lib/                # External libraries
│   ├── 📁 css/            # Library CSS files
│   └── 📁 js/             # Library JavaScript files
├── 📁 posts/              # Markdown blog documents
│   ├── 📁 sample-tutorials/    # Sample tutorial documents
│   ├── 📁 example-guides/      # Example guide documents
│   ├── 📁 demo-articles/       # Demo article samples
│   ├── 📁 test-content/        # Test content examples
│   └── 📁 ... (other categories)
├── 📁 properties/         # Configuration files
│   ├── ⚙️ main-config.json   # Main page configuration
│   ├── ⚙️ toc.json           # Table of contents
│   └── ⚙️ viewer-config.json # Viewer page configuration
├── 📄 index.html          # Main page
├── 📄 viewer.html         # Markdown viewer
├── 📄 favicon.svg         # Site icon
├── ⚙️ package.json        # Project configuration
├── 📄 .nojekyll           # GitHub Pages configuration
└── 📄 README.md           # This file
```

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: None (pure CSS)
- **JavaScript Libraries**: 
  - [marked.js](https://marked.js.org/) - Markdown parser
- **Hosting**: GitHub Pages

## Responsive Design

### Desktop (1200px+)
- 3-4 column grid layout
- Large font sizes and spacing

### Tablet (768px - 1199px)
- 2-3 column grid layout
- Medium font sizes

### Mobile (768px and below)
- Single column vertical layout
- Touch-friendly button sizes
- Compact header

## Adding Documents

1. Add `.md` files to the appropriate category folder in the `posts/` directory
2. Update the `properties/toc.json` file to include the new document
3. Commit and push files to GitHub
4. The site automatically detects and displays new documents

### Properties Configuration

#### Adding New Documents to Existing Categories
Update `properties/toc.json` to add new files to existing categories:

```json
{
  "category_name": {
    "title": "📝 Category Display Title",
    "files": [
      {
        "title": "Document Display Title",
        "path": "category-folder/document-name.md",
        "disable_auto_toc": false
      }
    ]
  }
}
```

#### Adding New Categories
To add a completely new category, add a new section to `properties/toc.json`:

```json
{
  "new_category": {
    "title": "🆕 New Category Title",
    "files": [
      {
        "title": "First Document",
        "path": "new-category/first-document.md"
      }
    ]
  }
}
```

### Example
```bash
# Add new markdown file
echo "# New Document Title" > posts/example-category/new-document.md

# Update toc.json to include the new document
# Edit properties/toc.json and add the file entry

# Add to Git and commit
git add posts/example-category/new-document.md properties/toc.json
git commit -m "Add new document and update TOC"
git push origin main
```

**Note**: Directory names in `posts/` should match the category structure in `toc.json` for proper organization.

## Configuration

The system uses three JSON configuration files in the `properties/` directory:

### main-config.json
Site-wide configuration settings including titles, URLs, and display options.

```json
{
  "site_title": "Your Site Title",
  "main_title": "Main Page Title",
  "main_subtitle": "Your subtitle here",
  "site_url": "https://github.com/yourusername",
  "show_document_count": true,
  "show_home_button": true
}
```

### toc.json
Table of contents structure that organizes blog posts into categories.

```json
{
  "category_name": {
    "title": "📝 Category Display Title",
    "files": [
      {
        "title": "Document Title",
        "path": "folder/document.md"
      }
    ]
  }
}
```

### viewer-config.json
Viewer page settings for theme options and UI elements.

```json
{
  "show_table_of_contents": true,
  "default_theme": "light",
  "show_theme_toggle": true,
  "page_title": "Viewer Page Title"
}
```

## Live Site

**[tansan5150.github.io](https://tansan5150.github.io)**

## Local Development

### Requirements
- Web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional)

### Setup
```bash
# Clone repository
git clone https://github.com/tansan5150/tansan5150.github.io.git
cd tansan5150.github.io

# Run local server (Python 3 example)
python -m http.server 8000

# Open http://localhost:8000 in browser
```

## Performance Optimization

- **Minimal HTTP requests**: Reduced CDN library usage
- **Separated CSS/JS**: Enhanced caching efficiency
- **Image optimization**: Automatic resizing and compression
- **Asynchronous loading**: GitHub API asynchronous processing

## Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

This project is licensed under the Creative Commons Attribution 2.0 License. See the [LICENSE](LICENSE) file for details.

## Contact

- **GitHub**: [@tansan5150](https://github.com/tansan5150)
- **Website**: [tansan5150.github.io](https://tansan5150.github.io)

---

<div align="center">
  <p>Made by tansan5150</p>
  <p>
    <a href="https://tansan5150.github.io">Live Site</a> •
    <a href="https://github.com/tansan5150/tansan5150.github.io/issues">Report Bug</a> •
    <a href="https://github.com/tansan5150/tansan5150.github.io/issues">Request Feature</a>
  </p>
</div>