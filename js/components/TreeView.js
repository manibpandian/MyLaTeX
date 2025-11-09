const { useState, useEffect } = React;

const TreeView = () => {
  const [openNodes, setOpenNodes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  
  const { addNotification, status } = useNotifications();
  
  const {
    rootDirectoryHandle,
    operationLoading,
    setOperationLoading,
    loadRealDirectory,
    moveRealNodeToTrash,
    restoreFromTrash,
    deleteRealNode,
    addRealFolder,
    addRealFile,
    renameRealNode,
    disconnectDirectory,
    readFileContent
  } = useFileSystem(addNotification);

    useEffect(() => {
    setTreeData([]);
    setIsLoading(false);
    
    // Initialize Monaco editor after component mounts
    setTimeout(() => {
      if (window.initializeMonacoEditor) {
        window.initializeMonacoEditor();
      }
    }, 500);
  }, []);

  const toggleNode = (nodeId) => {
    setOpenNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Virtual node operations (for demo mode without filesystem)
  const deleteVirtualNode = (nodeId) => {
    const removeNode = (nodes) => {
      return nodes.filter(node => {
        if (node.id === nodeId) return false;
        if (node.children) node.children = removeNode(node.children);
        return true;
      });
    };
    setTreeData(removeNode([...treeData]));
  };

  const addVirtualFolder = async (parentId) => {
    const findParent = (nodes) => {
      for (const node of nodes) {
        if (node.id === parentId) return node;
        if (node.children) {
          const found = findParent(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const parent = findParent(treeData);
    const existingNames = parent ? parent.children.map(child => child.name) : [];
    
    let folderName = 'NewFolder';
    let counter = 1;
    while (existingNames.includes(folderName)) {
      folderName = `NewFolder${counter}`;
      counter++;
    }

    const newFolder = { id: `folder-${Date.now()}`, name: folderName, children: [] };
    const addToParent = (nodes) => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newFolder] };
        }
        if (node.children) return { ...node, children: addToParent(node.children) };
        return node;
      });
    };

    setTreeData(addToParent([...treeData]));
    setOpenNodes(prev => ({ ...prev, [parentId]: true }));
    setEditingNodeId(newFolder.id);
  };

  const addVirtualFile = async (parentId) => {
    const findParent = (nodes) => {
      for (const node of nodes) {
        if (node.id === parentId) return node;
        if (node.children) {
          const found = findParent(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const parent = findParent(treeData);
    const existingNames = parent ? parent.children.map(child => child.name) : [];
    
    let fileName = 'NewFile.tex';
    let counter = 1;
    while (existingNames.includes(fileName)) {
      fileName = `NewFile${counter}.tex`;
      counter++;
    }

    const newFile = { id: `file-${Date.now()}`, name: fileName };
    const addToParent = (nodes) => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newFile] };
        }
        if (node.children) return { ...node, children: addToParent(node.children) };
        return node;
      });
    };

    setTreeData(addToParent([...treeData]));
    setOpenNodes(prev => ({ ...prev, [parentId]: true }));
    setEditingNodeId(newFile.id);
  };

  const renameVirtualNode = (nodeId, newName) => {
    const updateNode = (nodes) => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, name: newName };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setTreeData(updateNode([...treeData]));
  };

  // Main CRUD operations
  const handleLoadDirectory = async () => {
    const newTree = await loadRealDirectory();
    if (newTree) {
      setTreeData(newTree);
    }
  };

  const moveToTrash = async (nodeId) => {
    const pathParts = nodeId.split('/');
    const itemName = pathParts[pathParts.length - 1];
    
    setOperationLoading(`trash-${nodeId}`);
    
    try {
      if (rootDirectoryHandle) {
        const newTree = await moveRealNodeToTrash(nodeId);
        if (newTree) setTreeData(newTree);
        addNotification(`Moved "${itemName}" to trash`, 'success');
      } else {
        deleteVirtualNode(nodeId);
        addNotification(`Moved "${itemName}" to trash`, 'success');
      }
    } catch (error) {
      console.error('Error moving to trash:', error);
      addNotification(`Failed to move to trash: ${error.message}`, 'error');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleRestoreFromTrash = async (trashNodeId, node) => {
    try {
      const newTree = await restoreFromTrash(trashNodeId, node);
      if (newTree) setTreeData(newTree);
    } catch (error) {
      // Error already handled in restoreFromTrash
    }
  };

  const deleteNode = async (nodeId) => {
    const confirmed = confirm('Are you sure you want to delete this item? This will permanently delete the actual file/folder.');
    if (!confirmed) return;

    setOperationLoading(`delete-${nodeId}`);
    
    try {
      if (rootDirectoryHandle) {
        await deleteRealNode(nodeId);
        addNotification('Item deleted successfully', 'success');
      }
      deleteVirtualNode(nodeId);
      addNotification('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      addNotification(`Failed to delete item: ${error.message}`, 'error');
    } finally {
      setOperationLoading(null);
    }
  };

  const addFolder = async (parentId) => {
    setOperationLoading(`add-folder-${parentId}`);
    
    try {
      if (rootDirectoryHandle) {
        const newTree = await addRealFolder(parentId, setOpenNodes, setEditingNodeId);
        if (newTree) setTreeData(newTree);
        addNotification('Folder created successfully', 'success');
      } else {
        await addVirtualFolder(parentId);
        addNotification('Folder created successfully', 'success');
      }
    } catch (error) {
      console.error('Error adding folder:', error);
      addNotification(`Failed to create folder: ${error.message}`, 'error');
      throw error;
    } finally {
      setOperationLoading(null);
    }
  };

  const addFile = async (parentId) => {
    setOperationLoading(`add-file-${parentId}`);
    
    try {
      if (rootDirectoryHandle) {
        const newTree = await addRealFile(parentId, setOpenNodes, setEditingNodeId);
        if (newTree) setTreeData(newTree);
        addNotification('File created successfully', 'success');
      } else {
        await addVirtualFile(parentId);
        addNotification('File created successfully', 'success');
      }
    } catch (error) {
      console.error('Error adding file:', error);
      addNotification(`Failed to create file: ${error.message}`, 'error');
    } finally {
      setOperationLoading(null);
    }
  };

  const renameNode = async (nodeId, newName) => {
    const validation = validateFileName(newName);
    if (!validation.isValid) {
      addNotification(`Invalid name: ${validation.error}`, 'error');
      throw new Error(validation.error);
    }
    
    const sanitizedName = validation.sanitized;
    setOperationLoading(`rename-${nodeId}`);
    
    try {
      if (rootDirectoryHandle) {
        const newTree = await renameRealNode(nodeId, sanitizedName);
        if (newTree) setTreeData(newTree);
        addNotification('Item renamed successfully', 'success');
      } else {
        renameVirtualNode(nodeId, sanitizedName);
        addNotification('Item renamed successfully', 'success');
      }
    } catch (error) {
      console.error('Error in renameNode:', error);
      addNotification(`Failed to rename item: ${error.message}`, 'error');
      throw error;
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDisconnect = () => {
    const newTree = disconnectDirectory();
    setTreeData(newTree);
  };

  if (isLoading) {
    return React.createElement("div", { className: "container loading" },
      React.createElement("div", null, "Loading...")
    );
  }

  return React.createElement("div", { className: "app" },
    React.createElement("div", { className: `sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}` },
      React.createElement("div", { className: "sidebar-header" },
        React.createElement("button", { 
          onClick: toggleSidebar, 
          className: "hamburger-btn",
          title: isSidebarOpen ? 'Close sidebar' : 'Open sidebar'
        },
          React.createElement(Icons.Menu, { className: "hamburger-icon" })
        ),
        isSidebarOpen && React.createElement("div", { className: "sidebar-controls" },
          React.createElement("h2", { className: "sidebar-title" }, "Nool"),
          React.createElement("div", { className: "connection-status" },
            React.createElement("button", { 
              className: `status-indicator ${rootDirectoryHandle ? 'connected' : 'disconnected'}`,
              onClick: rootDirectoryHandle ? handleDisconnect : null,
              title: rootDirectoryHandle ? 'Click to disconnect' : 'Not connected',
              style: { cursor: rootDirectoryHandle ? 'pointer' : 'default' }
            }, rootDirectoryHandle ? '🟢' : '🔴')
          ),
          rootDirectoryHandle && React.createElement("div", { className: "header-actions" },
            React.createElement("button", {
              onClick: () => addFolder(''),
              className: "action-btn folder-action",
              title: "Add folder"
            }, React.createElement(Icons.FolderPlus, { className: "icon-small icon-blue-dark" })),
            React.createElement("button", {
              onClick: () => addFile(''),
              className: "action-btn file-action", 
              title: "Add file"
            }, React.createElement(Icons.FilePlus, { className: "icon-small icon-green" }))
          )
        )
      ),
      isSidebarOpen && React.createElement("div", { className: "tree-container" },
        React.createElement(TreeContext.Provider, { value: { openNodes, toggleNode } },
          treeData.length === 0 && !rootDirectoryHandle
            ? React.createElement("div", { className: "empty-state" },
                React.createElement("div", { className: "empty-icon" }, "📁"),
                React.createElement("h3", { className: "empty-title" }, "No Directory Connected"),
                React.createElement("p", { className: "empty-description" }, 
                  "Click the folder button above to connect to a directory and start managing your files."
                ),
                React.createElement("button", {
                  onClick: handleLoadDirectory,
                  className: "empty-connect-btn"
                }, "Connect Directory")
              )
            : (window.TreeNode ? treeData.map((node) =>
                React.createElement(window.TreeNode, {
                  key: node.id,
                  node: node,
                  onDelete: deleteNode,
                  onAddFolder: addFolder,
                  onAddFile: addFile,
                  onRename: renameNode,
                  editingNodeId: editingNodeId,
                  setEditingNodeId: setEditingNodeId,
                  moveToTrash: moveToTrash,
                  restoreFromTrash: handleRestoreFromTrash,
                  onFileSelect: readFileContent
                })
              ) : React.createElement('div', { className: 'loading-tree' }, 'Loading tree components...'))
        ),
            status.visible && React.createElement('div', {
              className: `tree-status tree-status-${status.type}`
            }, status.message)
      )
    ),
    React.createElement("div", { className: "main-content" },
      React.createElement("div", { className: "left-pane" },
        React.createElement("div", { id: "monaco-editor", style: { width: '100%', height: '100%' } })
      ),
      React.createElement("div", { className: "vertical-splitter", id: "vertical-splitter" }),
      React.createElement("div", { className: "right-pane" },
        React.createElement("div", { id: "pdf-viewer", style: { width: '100%', height: '100%', overflow: 'auto', background: '#2d2d30' } })
      )
    )
  );
};
