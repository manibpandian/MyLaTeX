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