// ============================================
// Monaco Editor Theme Configuration
// Modular design for easy customization
// ============================================

const MonacoThemes = {
  // Elegant LaTeX Theme - Sophisticated midnight palette with gold accents
  elegantLatex: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // Comments
      { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
      
      // LaTeX Commands
      { token: 'keyword', foreground: 'd4af37', fontStyle: 'bold' },
      { token: 'type', foreground: 'd4af37' },
      
      // Braces and Delimiters
      { token: 'delimiter', foreground: '5eead4' },
      { token: 'delimiter.bracket', foreground: '5eead4' },
      { token: 'delimiter.curly', foreground: '5eead4' },
      { token: 'delimiter.square', foreground: '5eead4' },
      
      // Strings and Text
      { token: 'string', foreground: 'c9d1d9' },
      
      // Numbers
      { token: 'number', foreground: '67e8f9' },
      
      // Variables
      { token: 'variable', foreground: 'f0d98e' },
      { token: 'identifier', foreground: 'e6d5a8' },
      
      // Math Mode
      { token: 'keyword.math', foreground: 'c4b5fd', fontStyle: 'italic' },
      { token: 'delimiter.math', foreground: 'a78bfa' },
      
      // Environment names
      { token: 'type.identifier', foreground: '5eead4' },
      
      // Special commands
      { token: 'keyword.control', foreground: 'ffd700', fontStyle: 'bold' },
      
      // Operators
      { token: 'operator', foreground: 'cbd5e1' },
      
      // Tags and labels
      { token: 'tag', foreground: '86efac' },
      { token: 'attribute.name', foreground: '6ee7b7' },
      
      // Functions
      { token: 'function', foreground: '67e8f9' },
      
      // Constants
      { token: 'constant', foreground: 'fbbf24' },
      
      // Invalid/Error
      { token: 'invalid', foreground: 'fca5a5', fontStyle: 'underline' },
      
      // Annotations
      { token: 'annotation', foreground: 'fcd34d' },
    ],
    colors: {
      // Editor core
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      
      // Line numbers
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#d4af37',
      
      // Cursor
      'editorCursor.foreground': '#d4af37',
      
      // Selection
      'editor.selectionBackground': '#1a4d6d80',
      'editor.selectionHighlightBackground': '#1a4d6d40',
      'editor.inactiveSelectionBackground': '#1a4d6d60',
      
      // Find/Search
      'editor.findMatchBackground': '#d4af3740',
      'editor.findMatchHighlightBackground': '#d4af3720',
      'editor.findRangeHighlightBackground': '#d4af3710',
      
      // Line highlight
      'editor.lineHighlightBackground': '#161b2215',
      'editor.lineHighlightBorder': '#00000000',
      
      // Whitespace
      'editorWhitespace.foreground': '#6e768115',
      
      // Indentation guides
      'editorIndentGuide.background': '#6e768120',
      'editorIndentGuide.activeBackground': '#6e768140',
      
      // Bracket matching
      'editorBracketMatch.background': '#5eead420',
      'editorBracketMatch.border': '#5eead4',
      
      // Gutter
      'editorGutter.background': '#0d1117',
      'editorGutter.modifiedBackground': '#67e8f9',
      'editorGutter.addedBackground': '#86efac',
      'editorGutter.deletedBackground': '#fca5a5',
      
      // Scrollbar
      'scrollbar.shadow': '#00000050',
      'scrollbarSlider.background': '#d4af3720',
      'scrollbarSlider.hoverBackground': '#d4af3730',
      'scrollbarSlider.activeBackground': '#d4af3740',
      
      // Widgets
      'editorWidget.background': '#161b22',
      'editorWidget.border': '#d4af3730',
      'editorWidget.foreground': '#c9d1d9',
      
      // Suggest (autocomplete)
      'editorSuggestWidget.background': '#161b22',
      'editorSuggestWidget.border': '#d4af3730',
      'editorSuggestWidget.foreground': '#c9d1d9',
      'editorSuggestWidget.selectedBackground': '#1a4d6d80',
      'editorSuggestWidget.highlightForeground': '#d4af37',
      
      // Hover widget
      'editorHoverWidget.background': '#161b22',
      'editorHoverWidget.border': '#d4af3730',
      
      // Peek view
      'peekView.border': '#d4af37',
      'peekViewEditor.background': '#0d1117',
      'peekViewEditor.matchHighlightBackground': '#d4af3740',
      'peekViewResult.background': '#161b22',
      'peekViewResult.matchHighlightBackground': '#d4af3740',
      'peekViewResult.selectionBackground': '#1a4d6d80',
      'peekViewTitle.background': '#1c2128',
      
      // Minimap
      'minimap.background': '#0d1117',
      'minimap.selectionHighlight': '#d4af3740',
      'minimap.findMatchHighlight': '#d4af3760',
      
      // Overview ruler
      'editorOverviewRuler.border': '#00000000',
      'editorOverviewRuler.findMatchForeground': '#d4af3780',
      'editorOverviewRuler.selectionHighlightForeground': '#1a4d6d80',
      'editorOverviewRuler.errorForeground': '#fca5a5',
      'editorOverviewRuler.warningForeground': '#fcd34d',
      'editorOverviewRuler.infoForeground': '#67e8f9',
    }
  },

  // Add more themes here easily
  // Example: Classic Dark Theme
  classicDark: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorCursor.foreground': '#aeafad',
    }
  },

  // Example: Light Theme
  elegantLight: {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'b8972f', fontStyle: 'bold' },
      { token: 'string', foreground: '333333' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#333333',
      'editorCursor.foreground': '#b8972f',
    }
  }
};

// Theme Manager - Easy theme switching
const MonacoThemeManager = {
  currentTheme: 'elegantLatex', // Default theme
  
  // Register all themes with Monaco
  registerAllThemes() {
    if (typeof monaco === 'undefined') {
      console.warn('Monaco not loaded yet');
      return false;
    }
    
    try {
      Object.keys(MonacoThemes).forEach(themeName => {
        monaco.editor.defineTheme(themeName, MonacoThemes[themeName]);
      });
      return true;
    } catch (error) {
      console.error('Error registering themes:', error);
      return false;
    }
  },
  
  // Apply a specific theme
  applyTheme(themeName = 'elegantLatex') {
    if (typeof monaco === 'undefined') {
      console.warn('Monaco not loaded yet');
      return false;
    }
    
    if (!MonacoThemes[themeName]) {
      console.error(`Theme "${themeName}" not found`);
      return false;
    }
    
    try {
      monaco.editor.setTheme(themeName);
      this.currentTheme = themeName;
      return true;
    } catch (error) {
      console.error('Error applying theme:', error);
      return false;
    }
  },
  
  // Get list of available themes
  getAvailableThemes() {
    return Object.keys(MonacoThemes);
  },
  
  // Add a new theme dynamically
  addTheme(name, themeConfig) {
    MonacoThemes[name] = themeConfig;
    if (typeof monaco !== 'undefined') {
      monaco.editor.defineTheme(name, themeConfig);
    }
  },
  
  // Update existing theme colors
  updateThemeColors(themeName, colorUpdates) {
    if (!MonacoThemes[themeName]) {
      console.error(`Theme "${themeName}" not found`);
      return false;
    }
    
    MonacoThemes[themeName].colors = {
      ...MonacoThemes[themeName].colors,
      ...colorUpdates
    };
    
    if (typeof monaco !== 'undefined') {
      monaco.editor.defineTheme(themeName, MonacoThemes[themeName]);
      if (this.currentTheme === themeName) {
        this.applyTheme(themeName);
      }
    }
    
    return true;
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.MonacoThemes = MonacoThemes;
  window.MonacoThemeManager = MonacoThemeManager;
}

// For ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MonacoThemes, MonacoThemeManager };
}