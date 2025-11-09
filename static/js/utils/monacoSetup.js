// Monaco Editor Setup - Simplified approach
let monacoEditor = null;
let initializationAttempts = 0;
const MAX_ATTEMPTS = 5;

const initializeMonaco = () => {
  if (monacoEditor) {
    return;
  }
  
  initializationAttempts++;
  if (initializationAttempts > MAX_ATTEMPTS) {
    console.error('Max Monaco initialization attempts reached');
    return;
  }
  
  const container = document.getElementById('monaco-editor');
  if (!container) {
    setTimeout(initializeMonaco, 1000);
    return;
  }

  // Check if require is available
  if (typeof require === 'undefined') {
    setTimeout(initializeMonaco, 500);
    return;
  }

  try {
    // Use a specific version to avoid caching issues
    require.config({ 
      paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs' },
      'vs/nls': { availableLanguages: { '*': '' } }
    });
    
    require(['vs/editor/editor.main'], function () {
      try {
        // Register custom themes if available
        if (window.MonacoThemeManager) {
          window.MonacoThemeManager.registerAllThemes();
        }
        
        // Create Monaco editor with elegant theme
        monacoEditor = monaco.editor.create(container, {
          value: '% Select a file to edit\n',
          language: 'plaintext',
          theme: window.MonacoThemeManager ? 'elegantLatex' : 'vs-dark',
          automaticLayout: true,
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
          fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
          lineHeight: 22,
          letterSpacing: 0.5,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true
        });
        
        // Ensure theme is applied after creation
        setTimeout(() => {
          if (window.MonacoThemeManager) {
            window.MonacoThemeManager.applyTheme('elegantLatex');
            console.log('✓ Applied elegantLatex theme');
          }
        }, 100);
        
        // Make editor globally available
        window.monacoEditor = monacoEditor;
        
        // Register LaTeX language after editor is created
        setTimeout(() => {
          try {
            // Always re-register to ensure latest tokenizer
            const existingLang = monaco.languages.getLanguages().find(l => l.id === 'latex');
            if (!existingLang) {
              monaco.languages.register({ id: 'latex' });
              console.log('✓ Registered LaTeX language');
            } else {
              console.log('LaTeX language already registered, updating tokenizer...');
            }
            
            // Set/update the tokenizer (this will override any existing one)
            monaco.languages.setMonarchTokensProvider('latex', {
                tokenizer: {
                  root: [
                    // Comments (highest priority)
                    [/%.*$/, 'comment'],
                    
                    // Math delimiters (before other commands)
                    [/\$\$/, 'keyword.math'],
                    [/\$/, 'keyword.math'],
                    [/\\\[/, 'keyword.math'],
                    [/\\\]/, 'keyword.math'],
                    [/\\\(/, 'keyword.math'],
                    [/\\\)/, 'keyword.math'],
                    
                    // Sectioning commands with asterisk (must come before generic commands)
                    [/\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\*/, 'keyword'],
                    [/\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)(?![a-zA-Z])/, 'keyword'],
                    
                    // Special commands
                    [/\\(documentclass|usepackage|newcommand|renewcommand|input|include)(?![a-zA-Z])/, 'keyword.control'],
                    
                    // Environments
                    [/\\(begin|end)(?![a-zA-Z])/, 'keyword', '@environment'],
                    
                    // Text formatting
                    [/\\(textbf|textit|texttt|emph|underline|textsc)(?![a-zA-Z])/, 'type'],
                    
                    // Labels and references
                    [/\\(label|ref|eqref|cite|bibliography|bibliographystyle)(?![a-zA-Z])/, 'tag'],
                    
                    // Generic commands with optional asterisk (lowest priority for commands)
                    [/\\[a-zA-Z]+\*/, 'function'],
                    [/\\[a-zA-Z]+/, 'function'],
                    
                    // Braces
                    [/[{}]/, 'delimiter.curly'],
                    [/[\[\]]/, 'delimiter.square'],
                    
                    // Numbers
                    [/\d+/, 'number'],
                  ],
                  
                  // Environment state - to colorize environment names
                  environment: [
                    [/\{/, 'delimiter.curly', '@environmentName'],
                    [/./, '', '@pop']
                  ],
                  
                  environmentName: [
                    [/[a-zA-Z*]+/, 'type.identifier'],
                    [/\}/, 'delimiter.curly', '@pop'],
                  ]
                }
              });
              console.log('✓ LaTeX tokenizer registered with enhanced syntax');
          } catch (langError) {
            console.warn('Could not register LaTeX language:', langError);
          }
        }, 100);
        
      } catch (editorError) {
        console.error('Error creating Monaco editor:', editorError);
      }
    });
    
  } catch (requireError) {
    console.error('Error with Monaco require:', requireError);
    setTimeout(initializeMonaco, 1000);
  }
};

// Function to get language from file extension
const getLanguageFromExtension = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const languageMap = {
    'tex': 'latex',
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'txt': 'plaintext',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml'
  };
  return languageMap[extension] || 'plaintext';
};

// Function to update Monaco editor content
const updateMonacoContent = (content, fileName) => {
  if (!monacoEditor) {
    return;
  }
  
  try {
    const language = getLanguageFromExtension(fileName);
    
    // Set content
    monacoEditor.setValue(content || '');
    
    // Set language
    const model = monacoEditor.getModel();
    if (model && monaco) {
      monaco.editor.setModelLanguage(model, language);
    }
  } catch (error) {
    console.error('Error updating Monaco content:', error);
  }
};

// Make functions globally available
window.updateMonacoContent = updateMonacoContent;
window.initializeMonacoEditor = initializeMonaco;

// Setup editor toolbar - instant show on hover, larger trigger area
let editorToolbarHideTimeout = null;

const setupEditorToolbarAutoHide = () => {
  const editorPane = document.getElementById('editor-pane');
  const toolbar = editorPane?.querySelector('.editor-toolbar');
  
  if (!editorPane || !toolbar) {
    setTimeout(setupEditorToolbarAutoHide, 500);
    return;
  }
  
  const showToolbar = (e) => {
    const rect = editorPane.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    // Show instantly when mouse is in top 200px (larger area)
    if (mouseY < 200) {
      if (editorToolbarHideTimeout) {
        clearTimeout(editorToolbarHideTimeout);
      }
      toolbar.classList.add('visible');
    } else {
      // Hide after 2 seconds when mouse moves away (longer delay)
      if (editorToolbarHideTimeout) {
        clearTimeout(editorToolbarHideTimeout);
      }
      editorToolbarHideTimeout = setTimeout(() => {
        toolbar.classList.remove('visible');
      }, 2000);
    }
  };
  
  editorPane.addEventListener('mousemove', showToolbar);
  
  // Keep visible while hovering toolbar itself
  toolbar.addEventListener('mouseenter', () => {
    if (editorToolbarHideTimeout) {
      clearTimeout(editorToolbarHideTimeout);
    }
    toolbar.classList.add('visible');
  });
  
  // Hide after 2 seconds when leaving toolbar
  toolbar.addEventListener('mouseleave', () => {
    editorToolbarHideTimeout = setTimeout(() => {
      toolbar.classList.remove('visible');
    }, 500);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEditorToolbarAutoHide);
} else {
  setupEditorToolbarAutoHide();
}

window.setupEditorToolbarAutoHide = setupEditorToolbarAutoHide;

// Helper function to switch Monaco theme
window.switchMonacoTheme = (themeName) => {
  if (window.MonacoThemeManager) {
    const success = window.MonacoThemeManager.applyTheme(themeName);
    if (success) {
      console.log(`✓ Switched to theme: ${themeName}`);
    } else {
      console.error(`✗ Failed to switch to theme: ${themeName}`);
    }
    return success;
  }
  console.warn('MonacoThemeManager not available');
  return false;
};