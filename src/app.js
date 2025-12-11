import MarkdownRenderer from './renderer.js';

// Create renderer instance
const renderer = new MarkdownRenderer();

// Load and render markdown when page loads
renderer.loadAndRender('test-01.md');

// Expose renderer globally so you can call it from console or other scripts
window.markdownRenderer = renderer;




