import * as SDK from "azure-devops-extension-sdk";
import MarkdownRenderer from './renderer';

// Check if running in Azure DevOps or local development
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isLocalDev) {
  console.log('🔧 Running in LOCAL DEVELOPMENT mode');
  // Load test content immediately for local development
  loadLocalTestFile();
} else {
  // Initialize the Azure DevOps extension SDK (only in production)
  console.log('🚀 Initializing Azure DevOps Extension SDK');

  SDK.init({ loaded: false }).then(() => {
    console.log('✅ Azure DevOps SDK initialized');

    // Wait for SDK to be ready
    SDK.ready().then(() => {
      console.log('✅ Azure DevOps SDK ready');

      // Register the markdown preview renderer
      SDK.register("markdown_preview_renderer", function () {
        return {
          /**
           * This method is called by Azure DevOps when a markdown file is opened
           * @param rawContent - The raw markdown file content
           * @param options - Additional options provided by Azure DevOps
           */
          renderContent: async function (rawContent: string, options: any) {
            console.log('📄 Rendering markdown content', options);

            // Create renderer instance
            const renderer = new MarkdownRenderer();

            // Render the markdown content
            await renderer.renderContent(rawContent, 'markdown-preview');
          }
        };
      });

      // Notify Azure DevOps that the extension has loaded successfully
      SDK.notifyLoadSucceeded();
      console.log('✅ Extension registered and ready');
    }).catch((error) => {
      console.error('❌ SDK ready error:', error);
    });
  }).catch((error) => {
    console.error('❌ SDK init error:', error);
  });
}

// Function to load test markdown for local development
async function loadLocalTestFile() {
  try {
    const response = await fetch('/test/test-01.md');
    const content = await response.text();

    const renderer = new MarkdownRenderer();
    await renderer.renderContent(content, 'markdown-preview');

    console.log('Loaded test markdown file for local development');
  } catch (error) {
    console.error('Failed to load test file:', error);

    // Fallback to sample content
    const renderer = new MarkdownRenderer();
    const sampleMarkdown = `# Azure DevOps Markdown Preview Extension

This extension is running in **local development mode**.

## Features

- YAML front matter support
- Mermaid diagrams
- KaTeX math equations
- Syntax highlighting
- And more!

### Sample Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Azure DevOps?}
    B -->|Yes| C[Load Extension]
    B -->|No| D[Local Dev Mode]
    C --> E[Render Content]
    D --> E
\`\`\`

### Sample Math

Inline: $E = mc^2$

Block:
$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
`;
    await renderer.renderContent(sampleMarkdown, 'markdown-preview');
  }
}
