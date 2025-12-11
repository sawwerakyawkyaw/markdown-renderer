import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import 'github-markdown-css/github-markdown-light.css';
import 'highlight.js/styles/github.css';

export default class MarkdownRenderer {
  constructor() {
    // Configure marked with syntax highlighting
    marked.use(markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }
    }));

    // Initialize mermaid
    mermaid.initialize({ startOnLoad: false });
  }

  /**
   * Render markdown content to a specified container
   * @param {string} markdownContent - The markdown text to render
   * @param {string} containerId - The ID of the container element (default: 'markdown-preview')
   */
  async renderContent(markdownContent, containerId = 'markdown-preview') {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    try {
      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownContent);

      // Sanitize HTML
      const sanitizedHtml = DOMPurify.sanitize(htmlContent);

      // Insert sanitized HTML into container
      container.innerHTML = sanitizedHtml;

      // Render Mermaid diagrams
      await this.renderMermaidDiagrams(container);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      container.innerHTML = '<p>Error rendering markdown content</p>';
    }
  }

  /**
   * Render mermaid diagrams in the given container
   * @param {HTMLElement} container - The container element
   */
  async renderMermaidDiagrams(container) {
    const mermaidBlocks = container.querySelectorAll('code.language-mermaid');

    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i];
      const code = block.textContent;
      const preElement = block.parentElement;

      // Create a div for mermaid
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = code;
      mermaidDiv.id = `mermaid-${i}`;

      try {
        // Replace the <pre><code> with the mermaid div
        preElement.replaceWith(mermaidDiv);

        // Render this specific mermaid diagram
        await mermaid.run({
          nodes: [mermaidDiv]
        });
      } catch (err) {
        console.error('Mermaid render failed:', err);

        // Create error message div
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'background-color: #ffd5cdff; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin-bottom: 8px; color: #856404;';
        errorDiv.innerHTML = '<strong>Mermaid Syntax Error:</strong> ' + err.message;

        // On render failure, fallback to showing original text as markdown code
        const fallbackMd = '```mermaid\n' + code + '\n```';
        const fallbackHtml = marked.parse(fallbackMd);
        const fallbackDiv = document.createElement('div');
        fallbackDiv.innerHTML = fallbackHtml;

        // Create wrapper to hold both error message and code block
        const wrapperDiv = document.createElement('div');
        wrapperDiv.appendChild(errorDiv);
        wrapperDiv.appendChild(fallbackDiv);

        // Replace failed mermaid div with wrapper containing error + code block
        mermaidDiv.replaceWith(wrapperDiv);
      }
    }
  }

  /**
   * Load markdown from server and render it
   * @param {string} filename - The markdown file to load
   * @param {string} containerId - The ID of the container element
   */
  async loadAndRender(filename, containerId = 'markdown-preview') {
    try {
      const response = await fetch(`/api/markdown/${filename}`);
      const data = await response.json();
      await this.renderContent(data.content, containerId);
    } catch (error) {
      console.error('Error loading markdown file:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<p>Error loading markdown file</p>';
      }
    }
  }
}
