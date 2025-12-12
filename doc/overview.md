# Markdown Preview Extension for Azure DevOps

An advanced Markdown preview extension for Azure DevOps that provides rich rendering capabilities for your markdown files in Azure Repos.

## Features

### 📝 Enhanced Markdown Support
- **GitHub Flavored Markdown** - Full support for GFM syntax
- **YAML Front Matter** - Displays front matter as formatted HTML tables
- **Footnotes** - Properly formatted footnote references and definitions
- **Subscript and Superscript** - Using `~text~` and `^text^` syntax

### 📊 Diagrams
- **Mermaid Diagrams** - Renders flowcharts, sequence diagrams, gantt charts, and more
- Support for both fenced code blocks (` ```mermaid `) and inline mermaid syntax

### 🧮 Mathematics
- **KaTeX Support** - Render inline and block mathematical equations
- Inline math: `$equation$`
- Block math: `$$equation$$`

### 🎨 Code Highlighting
- **Syntax Highlighting** - Powered by highlight.js
- Support for 100+ programming languages
- GitHub-style code block rendering

### 📋 YAML Front Matter
Automatically renders YAML front matter as clean HTML tables:
- Simple key-value pairs
- Nested objects displayed as lists
- Arrays of objects displayed as tables

## Supported File Extensions
- `.md`
- `.markdown`

## Usage

1. Navigate to any markdown file in your Azure Repos
2. Open the file to view it
3. The extension will automatically render a rich preview
4. Switch between "Preview" and "Code" tabs as needed

## Examples

### Mermaid Diagrams
\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
\`\`\`

### KaTeX Math
Inline: $E = mc^2$

Block:
$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

### Footnotes
Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.

## Technical Details

Built with:
- Marked.js for markdown parsing
- Mermaid for diagram rendering
- KaTeX for mathematical equations
- Highlight.js for syntax highlighting
- DOMPurify for safe HTML rendering
- js-yaml for YAML parsing

## License

ISC License

## Support

For issues, questions, or feature requests, please contact the extension publisher.
