# Azure DevOps Markdown Preview Extension

An advanced Markdown preview extension for Azure DevOps that provides rich rendering capabilities including YAML front matter, Mermaid diagrams, KaTeX math, footnotes, syntax highlighting, and more.

## Features

- ✨ **GitHub Flavored Markdown** - Full GFM support
- 📊 **Mermaid Diagrams** - Flowcharts, sequence diagrams, gantt charts, and more
- 🧮 **KaTeX Math** - Inline and block mathematical equations
- 📝 **YAML Front Matter** - Displays as formatted HTML tables
- 🔖 **Footnotes** - Properly formatted references and definitions
- 🎨 **Syntax Highlighting** - 100+ programming languages
- ⬆️⬇️ **Subscript/Superscript** - Using `~text~` and `^text^` syntax

## Development Setup

### Prerequisites

```bash
npm install
npm install -g tfx-cli  # Azure DevOps CLI tool
```

### Development Mode (with hot reload)

1. **Create development package:**
```bash
npm run package:dev
```

2. **Start development server (HTTPS on localhost:44300):**
```bash
npm run serve
```

3. **Install the generated `.vsix` file** in your Azure DevOps organization

### Production Build

1. **Build the extension:**
```bash
npm run build:prod
```

2. **Package the extension:**
```bash
npm run package
```

3. **Upload the `.vsix` file** to Azure DevOps Marketplace or install it in your organization

## Available Scripts

- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run build:prod` - Production build (same as `build`)
- `npm run watch` - Watch mode for development
- `npm run serve` - Start HTTPS dev server on port 44300
- `npm run package` - Create production extension package (.vsix)
- `npm run package:dev` - Create development extension package (.vsix)

## Project Structure

```
learning/
├── src/
│   ├── index.ts          # Extension entry point (Azure DevOps SDK initialization)
│   └── renderer.js       # Markdown rendering logic
├── public/
│   └── index.html        # HTML template
├── doc/
│   ├── overview.md       # Marketplace overview
│   └── icon.png          # Extension icon (128x128 recommended)
├── configs/
│   ├── dev.json          # Development configuration overrides
│   └── release.json      # Production configuration overrides
├── test/                 # Test markdown files
├── dist/                 # Built files (generated)
├── vss-extension.json    # Azure DevOps extension manifest
├── webpack.config.cjs    # Webpack configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Configuration

### Extension Manifest (`vss-extension.json`)

Key fields to update before publishing:
- `publisher` - Your Azure DevOps publisher name
- `id` - Unique extension ID
- `name` - Display name
- `version` - Semantic version
- `public` - Set to `true` for public marketplace

### Development vs Production

**Development (`configs/dev.json`):**
- Uses `index.html` from root
- Points to `https://localhost:44300`
- Extension ID: `azure-devops-markdown-preview-dev`
- Public: `false`

**Production (`configs/release.json`):**
- Uses `dist/index.html` (bundled)
- Extension ID: `azure-devops-markdown-preview`
- Served from Azure DevOps CDN

## How It Works

1. User opens a `.md` or `.markdown` file in Azure DevOps Repos
2. Azure DevOps detects the file extension and loads the extension
3. Extension's `renderContent()` method receives the file content
4. Markdown is parsed and rendered with all features:
   - YAML front matter extracted and formatted
   - Markdown converted to HTML with marked.js
   - Mermaid diagrams rendered
   - KaTeX equations processed
   - HTML sanitized with DOMPurify
5. Rendered content displayed in the preview pane

## Extension Contribution

This extension contributes a **content renderer** to Azure DevOps:

```json
{
  "type": "ms.vss-code-web.content-renderer",
  "targets": ["ms.vss-code-web.content-renderer-collection"],
  "properties": {
    "fileExtensions": ["md", "markdown"],
    "registeredObjectId": "markdown_preview_renderer"
  }
}
```

## Tech Stack

- **Azure DevOps Extension SDK** - Integration with Azure DevOps
- **TypeScript** - Type-safe development
- **Webpack** - Module bundling
- **Marked.js** - Markdown parsing
- **Mermaid** - Diagram rendering
- **KaTeX** - Math equation rendering
- **Highlight.js** - Syntax highlighting
- **DOMPurify** - HTML sanitization
- **js-yaml** - YAML front matter parsing

## Deployment

### First-time Setup

1. Create a publisher account on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. Update `publisher` field in `vss-extension.json`
3. Build and package the extension

### Publishing

```bash
# Build production version
npm run build:prod

# Package the extension
npm run package

# Publish to marketplace (requires publisher token)
npx tfx-cli extension publish --manifest-globs vss-extension.json --override "{\"public\": true}"
```

### Private Installation

If you don't want to publish to the public marketplace:

```bash
# Create private package
npm run package

# Upload .vsix file to your Azure DevOps organization:
# Organization Settings → Extensions → Browse marketplace → Upload extension
```

## Troubleshooting

### Build fails with TypeScript errors

```bash
# Clean and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

### Extension doesn't load in Azure DevOps

1. Check browser console for errors
2. Verify the extension is installed in your organization
3. For dev mode, ensure HTTPS dev server is running on port 44300
4. Check that `registeredObjectId` in configs matches `SDK.register()` in index.ts

### Mermaid diagrams don't render

- Ensure mermaid syntax is correct
- Check browser console for Mermaid errors
- Verify the content is wrapped in ` ```mermaid ` code blocks

## License

ISC

## Notes

**Important:** You'll need to create a `doc/icon.png` file (128x128 pixels) before packaging the extension for the marketplace.

## Contributing

This extension is a learning project. Feel free to fork and customize for your needs.
