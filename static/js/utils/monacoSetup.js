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
        // Create Monaco editor with minimal configuration first
        monacoEditor = monaco.editor.create(container, {
          value: '% Select a file to edit\n',
          language: 'plaintext',
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on'
        });
        
        // Make editor globally available
        window.monacoEditor = monacoEditor;
        
        // Register LaTeX language after editor is created
        setTimeout(() => {
          try {
            if (!monaco.languages.getLanguages().find(l => l.id === 'latex')) {
              monaco.languages.register({ id: 'latex' });
              monaco.languages.setMonarchTokensProvider('latex', {
                tokenizer: {
                  root: [
                    [/%.*$/, 'comment'],
                    [/\\\\(documentclass|usepackage|begin|end|section|subsection|chapter|title|author|date)/, 'keyword'],
                    [/\\\\[a-zA-Z]+/, 'function'],
                    [/\{|\}/, 'delimiter'],
                    [/\$\$[\s\S]*?\$\$|\$[^\$]*\$/, 'string']
                  ]
                }
              });
            }
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

// Setup editor toolbar auto-hide
let editorToolbarHideTimeout = null;
let editorToolbarShowTimeout = null;

const setupEditorToolbarAutoHide = () => {
  const editorPane = document.getElementById('editor-pane');
  const toolbar = editorPane?.querySelector('.editor-toolbar');
  
  if (!editorPane || !toolbar) {
    setTimeout(setupEditorToolbarAutoHide, 500);
    return;
  }
  
  const showToolbar = (e) => {
    // Only show if mouse is in top 100px of editor pane
    const rect = editorPane.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    if (mouseY > 100) {
      return; // Don't show if mouse is not near top
    }
    
    // Clear any pending show timeout
    if (editorToolbarShowTimeout) {
      clearTimeout(editorToolbarShowTimeout);
    }
    
    // Delay showing by 500ms to avoid accidental triggers
    editorToolbarShowTimeout = setTimeout(() => {
      toolbar.classList.add('visible');
      
      if (editorToolbarHideTimeout) {
        clearTimeout(editorToolbarHideTimeout);
      }
      
      // Hide after 1 second of inactivity
      editorToolbarHideTimeout = setTimeout(() => {
        toolbar.classList.remove('visible');
      }, 1000);
    }, 500);
  };
  
  editorPane.addEventListener('mousemove', showToolbar);
  
  toolbar.addEventListener('mouseenter', () => {
    if (editorToolbarHideTimeout) {
      clearTimeout(editorToolbarHideTimeout);
    }
    if (editorToolbarShowTimeout) {
      clearTimeout(editorToolbarShowTimeout);
    }
    toolbar.classList.add('visible');
  });
  
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