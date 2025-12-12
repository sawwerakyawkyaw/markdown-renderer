import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import yaml from 'js-yaml';
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

    // Add subscript and superscript extensions
    marked.use({
      extensions: [
        {
          name: 'subscript',
          level: 'inline',
          start(src) { return src.indexOf('~'); },
          tokenizer(src) {
            const match = src.match(/^~([^~\s]+)~/);
            if (match) {
              return {
                type: 'subscript',
                raw: match[0],
                text: match[1]
              };
            }
          },
          renderer(token) {
            return `<sub>${token.text}</sub>`;
          }
        },
        {
          name: 'superscript',
          level: 'inline',
          start(src) { return src.indexOf('^'); },
          tokenizer(src) {
            const match = src.match(/^\^([^^^\s]+)\^/);
            if (match) {
              return {
                type: 'superscript',
                raw: match[0],
                text: match[1]
              };
            }
          },
          renderer(token) {
            return `<sup>${token.text}</sup>`;
          }
        }
      ]
    });

    // Initialize mermaid
    mermaid.initialize({ startOnLoad: false });
  }

  /**
   * Extract YAML front matter from markdown content
   * @param {string} content - The markdown content
   * @returns {Object} Object with frontMatter (parsed object or null) and content (remaining markdown)
   */
  extractFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (match) {
      try {
        const frontMatter = yaml.load(match[1]);
        const markdownContent = match[2];
        return { frontMatter, content: markdownContent };
      } catch (error) {
        console.error('Error parsing YAML front matter:', error);
        return { frontMatter: null, content };
      }
    }

    return { frontMatter: null, content };
  }

  /**
   * Convert YAML front matter object to HTML table
   * @param {Object} frontMatter - The parsed YAML front matter
   * @returns {string} HTML table string
   */
  frontMatterToTable(frontMatter) {
    if (!frontMatter || typeof frontMatter !== 'object') {
      return '';
    }

    // Build header row with field names
    let tableHtml = '<table>\n<thead>\n<tr>';
    for (const key of Object.keys(frontMatter)) {
      const escapedKey = this.escapeHtml(String(key));
      tableHtml += `<th>${escapedKey}</th>`;
    }
    tableHtml += '</tr>\n</thead>\n<tbody>\n<tr>';

    // Build data row with values
    for (const value of Object.values(frontMatter)) {
      const escapedValue = this.escapeHtml(String(value));
      tableHtml += `<td>${escapedValue}</td>`;
    }
    tableHtml += '</tr>\n</tbody>\n</table>\n';

    return tableHtml;
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
      // Extract YAML front matter
      const { frontMatter, content } = this.extractFrontMatter(markdownContent);

      // Convert markdown to HTML
      const htmlContent = marked.parse(content);

      // Sanitize HTML
      let sanitizedHtml = DOMPurify.sanitize(htmlContent);

      // Prepend front matter table if it exists
      if (frontMatter) {
        const tableHtml = this.frontMatterToTable(frontMatter);
        sanitizedHtml = tableHtml + sanitizedHtml;
      }

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
