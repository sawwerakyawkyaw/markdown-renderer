// @ts-nocheck
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import markedFootnote from 'marked-footnote';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import yaml from 'js-yaml';
import katex from 'katex';
import 'github-markdown-css/github-markdown-light.css';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

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

    // Add footnote support
    marked.use(markedFootnote());

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
        },
        // Add KaTeX support for inline and block math
        {
          name: 'mathBlock',
          level: 'block',
          start(src) { return src.indexOf('$$'); },
          tokenizer(src) {
            const match = src.match(/^\$\$\n?([\s\S]+?)\n?\$\$/);
            if (match) {
              return {
                type: 'mathBlock',
                raw: match[0],
                text: match[1].trim()
              };
            }
          },
          renderer(token) {
            try {
              return katex.renderToString(token.text, {
                displayMode: true,
                throwOnError: false
              });
            } catch (error) {
              return `<div class="katex-error">Error rendering math: ${error.message}</div>`;
            }
          }
        },
        {
          name: 'mathInline',
          level: 'inline',
          start(src) { return src.indexOf('$'); },
          tokenizer(src) {
            const match = src.match(/^\$(?!\$)([^\$\n]+?)\$/);
            if (match) {
              return {
                type: 'mathInline',
                raw: match[0],
                text: match[1]
              };
            }
          },
          renderer(token) {
            try {
              return katex.renderToString(token.text, {
                displayMode: false,
                throwOnError: false
              });
            } catch (error) {
              return `<span class="katex-error">Error: ${error.message}</span>`;
            }
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

    let tableHtml = '<table>\n<thead>\n<tr>';

    // Build header row with field names
    for (const key of Object.keys(frontMatter)) {
      const escapedKey = this.escapeHtml(String(key));
      tableHtml += `<th>${escapedKey}</th>`;
    }
    tableHtml += '</tr>\n</thead>\n<tbody>\n<tr>';

    // Build data row with values
    for (const value of Object.values(frontMatter)) {
      tableHtml += `<td>${this.formatValue(value)}</td>`;
    }
    tableHtml += '</tr>\n</tbody>\n</table>\n';

    return tableHtml;
  }

  /**
   * Format a value for display in front matter table
   * @param {*} value - The value to format
   * @returns {string} HTML string
   */
  formatValue(value) {
    // Handle null/undefined
    if (value == null) {
      return '';
    }

    // Handle arrays of objects (like authors)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      return this.arrayOfObjectsToTable(value);
    }

    // Handle arrays of primitives
    if (Array.isArray(value)) {
      return value.map(v => this.escapeHtml(String(v))).join(', ');
    }

    // Handle objects
    if (typeof value === 'object') {
      return this.objectToList(value);
    }

    // Handle primitives
    return this.escapeHtml(String(value));
  }

  /**
   * Convert an array of objects to an HTML table
   * @param {Array<Object>} array - Array of objects
   * @returns {string} HTML table string
   */
  arrayOfObjectsToTable(array) {
    if (!array || array.length === 0) {
      return '';
    }

    // Get all unique keys from all objects
    const keys = [...new Set(array.flatMap(obj => Object.keys(obj)))];

    let html = '<table style="width: 100%;">\n<thead>\n<tr>';

    // Table headers - repeat for each object
    for (let i = 0; i < array.length; i++) {
      for (const key of keys) {
        html += `<th>${this.escapeHtml(key)}</th>`;
      }
    }
    html += '</tr>\n</thead>\n<tbody>\n<tr>';

    // Table data - one cell for each value
    for (const obj of array) {
      for (const key of keys) {
        const value = obj[key];
        if (value == null) {
          html += '<td></td>';
        } else if (typeof value === 'object') {
          html += `<td>${this.escapeHtml(JSON.stringify(value))}</td>`;
        } else {
          html += `<td>${this.escapeHtml(String(value))}</td>`;
        }
      }
    }

    html += '</tr>\n</tbody>\n</table>';
    return html;
  }

  /**
   * Convert an object to an HTML list
   * @param {Object} obj - Object to convert
   * @returns {string} HTML list string
   */
  objectToList(obj) {
    let html = '<ul>';
    for (const [key, value] of Object.entries(obj)) {
      html += `<li><strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}</li>`;
    }
    html += '</ul>';
    return html;
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

}
