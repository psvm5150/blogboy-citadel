# Blogboy Citadel

> Return your posts to me and I myself will carry you through the gates of Valhalla.  
> 🧴💨 You will code eternal, shiny and RESTful! 

A lightweight and simple blog management system for GitHub Pages blogs. Built as an alternative to Jekyll when design configuration became too complex and cumbersome.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://psvm5150.github.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## Features

- **Pure web technologies**: Built with HTML, CSS, and JavaScript without Jekyll
- **GitHub Pages compatible**: Static site hosting on GitHub Pages (no Jekyll required)
- **Dynamic markdown rendering**: Real-time document loading from local markdown files
- **Responsive design**: Works seamlessly across all devices
- **Lightweight and simple**: A minimalist blog management system for easy content organization

## Site Structure
```
blogboy-citadel/
├── 📁 css/
│   └── 📁 themes/            # Colour theme styles
│   ├── 🎨 common.css         # Shared base styles
│   ├── 🎨 main.css           # Main page styles
│   ├── 🎨 viewer.css         # Viewer page styles
├── 📁 js/
│   ├── ⚡ common.js          # Shared utilities and functions
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
│   ├── 📁 i18n/             # Internationalization files
│   │   ├── 🌐 ko.json       # Korean language pack
│   │   ├── 🌐 en.json       # English language pack
│   │   └── 🌐 es.json       # Spanish language pack
│   ├── ⚙️ main-config.json   # Main page configuration
│   ├── ⚙️ toc.json           # Table of contents
│   └── ⚙️ viewer-config.json # Viewer page configuration
├──  📁 scripts/
│   └── ⚡ generate-rss.js  # Build-time RSS feed generator
├── 📄 index.html          # Main page
├── 📄 viewer.html         # Markdown viewer
├── 📄 feed.xml            # Generated RSS feed (output file)
├── 📄 favicon.svg         # Site icon
└── 📄 README.md           # This file
```

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: None (pure CSS)
- **JavaScript Libraries**: 
  - [marked.js](https://marked.js.org/) - Markdown parser
  - [highlight.js](https://highlightjs.org/) - Code syntax highlighting
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
Site-wide configuration settings grouped into header, list, and footer sections.

```json
{
  "header": {
    "title": "Main Max: Fury Load",
    "subtitle": "You will code eternal, shiny and RESTful!",
    "show_badge": true,
    "badge_type": "text",
    "badge_text": "psvm5150.github.io",
    "badge_image": "tmp/kt3.png",
    "badge_url": "https://github.com/psvm5150"
  },
  "list": {
    "document_root": "posts/",
    "documents_per_page": 20,
    "show_view_filter": true,
    "default_view_filter": "category",
    "show_document_count": true,
    "show_new_indicator": true,
    "new_display_days": 15,
    "show_document_date": true
  },
  "footer": {
    "show_colour_toggle": true,
    "copyright_text": "© 2025 psvm5150.github.io. All rights reserved.",
    "show_home_button": true
  },
  "colour_theme": "dark-green-gradient",
  "default_colour_mode": "auto",
  "rss_feed_url": "/feed.xml",
  "site_locale": "default"
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
Viewer page settings for theme options and UI elements. Note: page_title has been renamed to header.title and the config is now grouped into header, viewer, and footer sections.

```json
{
  "header": {
    "title": "Main Max: Fury Load",
    "show_colour_toggle": true
  },
  "viewer": {
    "author": "psvm5150",
    "show_table_of_contents": true,
    "license_badge_image": "https://ccl.cckorea.org/images/ico-cc.png",
    "license_badge_link": "https://creativecommons.org/licenses/by/4.0/deed.ko",
    "license_description": "이 저작물은 Creative Commons 저작자표시 4.0 국제 라이선스에 따라 이용할 수 있습니다.",
    "facebook_share_url": "https://www.facebook.com/sharer/sharer.php?u={url}",
    "x_share_url": "https://twitter.com/intent/tweet?url={url}&text={title}"
  },
  "footer": {
    "copyright_text": "© 2025 psvm5150.github.io. All rights reserved."
  },
  "adsense": {
    "enabled": false,
    "client_id": "ca-pub-XXXXXXXXXXXXXXXX",
    "auto_ads": true
  },
  "colour_theme": "dark-green-gradient",
  "site_locale": "default"
}
```

### i18n Internationalization
Internationalization support for multiple languages. The system supports Korean (ko), English (en), and Spanish (es) language packs.

Language files are located in `properties/i18n/` directory. 
- `ar.json` - Arabic language pack
- `da.json` - Danish language pack
- `de.json` - German language pack
- `en.json` - English language pack  
- `es.json` - Spanish language pack
- `fi.json` - Finnish language pack
- `fr.json` - French language pack
- `hi.json` - Hindi language pack
- `it.json` - Italian language pack
- `ja.json` - Japanese language pack
- `ko.json` - Korean language pack
- `nl.json` - Dutch language pack
- `no.json` - Norwegian language pack
- `pt.json` - Portuguese language pack
- `ru.json` - Russian language pack
- `sv.json` - Swedish language pack
- `tr.json` - Turkish language pack
- `zh.json` - Chinese language pack

Additional language files can be added as needed.

Each language file contains translations for UI elements including:
- Button labels (Dark/Light mode, Home, etc.)
- Loading and error messages
- Search and navigation labels
- Document count formatting

To set the site language, configure the `site_locale` property in `main-config.json`:

```json
{
  "site_locale": "ko"
}
```

Available locale values: `"ko"` (Korean), `"en"` (English), `"es"` (Spanish), or `"default"`

**Note**: When `site_locale` is set to "default", the system will determine by browser settings

## Live Site

**[psvm5150.github.io](https://psvm5150.github.io)**

## Local Development

### Requirements
- Web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional)

### Setup
```bash
# Clone repository
git clone https://github.com/psvm5150/blogboy-citadel.git
cd blogboy-citadel

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

MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

- **GitHub**: [@psvm5150](https://github.com/psvm5150/blogboy-citadel)

---

<div align="center">
  <p>Made by psvm5150</p>
  <p>
    <a href="https://psvm5150.github.io">Live Site</a> •
    <a href="https://github.com/psvm5150/blogboy-citadel/issues">Report Bug</a> •
    <a href="https://github.com/psvm5150/blogboy-citadel/issues">Request Feature</a>
  </p>
</div>

## RSS Feed Generation

This project can automatically generate an RSS feed from Markdown posts under the configured document_root.

Behavior
- Preferred: properties/main-config.json "rss_feed_url" controls feed output. If empty or unwritable, generation is skipped.
- Legacy fallback: if main-config.rss_feed_url is undefined, viewer-config.json viewer.rss_feed_url (or viewer-config.rss_feed_url) will be used.
- Generation happens at build-time by a Node.js script to avoid runtime performance impact in the browser. The script also skips writing if the content is unchanged.

How to use
1. Set document root in properties/main-config.json (already used by the site):
   - list.document_root, e.g., "posts/"
2. Set the feed output path in properties/main-config.json:
   - rss_feed_url, e.g., "/feed.xml" to generate at the site root.
3. Run the generator locally or in CI:

```bash
node scripts/generate-rss.js
```

Details
- The script scans all .md files under document_root.
- Item title is taken from properties/toc.json (if available), otherwise from the first H1 in the Markdown, then falls back to the filename.
- Item date prefers properties/toc.json date; otherwise uses the file's last modified time.
- Item description is derived from the first paragraph (Markdown stripped).
- Item link uses the same scheme as the site: /viewer.html?file=posts/<relative-path>.

Example
- If main-config.rss_feed_url is "/feed.xml": the file feed.xml will be generated at the repository root.
- If rss_feed_url is empty: no feed is generated.
