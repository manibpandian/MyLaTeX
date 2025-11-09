const { useState, useContext, useEffect } = React;

const TreeNode = ({ node, level = 0, onDelete, onAddFolder, onAddFile, onRename, editingNodeId, setEditingNodeId, moveToTrash, restoreFromTrash, onFileSelect, activeFilePath }) => {
  console.log('TreeNode rendered:', node.name, 'isFolder:', node.children !== undefined, 'onFileSelect:', !!onFileSelect);
  
  const { openNodes, toggleNode } = useContext(TreeContext);
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(editingNodeId === node.id);
  const [editName, setEditName] = useState(node.name);
  const isOpen = openNodes[node.id] || false;
  const hasChildren = node.children && node.children.length > 0;
  const isFolder = node.children !== undefined;
  
  // Check if this item is inside the .trash folder
  const isInTrash = (node.id.includes('/.trash/') || node.id.startsWith('.trash/')) && node.name !== '.trash';
  const isTrashFolder = node.name === '.trash';

  // Handle when this node should enter edit mode
  useEffect(() => {
    if (editingNodeId === node.id) {
      setIsEditing(true);
      setEditName(node.name);
    }
  }, [editingNodeId, node.id, node.name]);

  const handleToggle = () => {
    if (hasChildren) {
      toggleNode(node.id);
    }
  };

  const handleDoubleClick = () => {
    // Prevent renaming .trash folder
    if (node.name === '.trash') {
      return;
    }
    setIsEditing(true);
    setEditName(node.name);
  };

  const handleRename = async () => {
    if (editName.trim() && editName !== node.name) {
      try {
        await onRename(node.id, editName.trim());
      } catch (error) {
        console.error('Rename failed:', error);
        // Reset to original name on error
        setEditName(node.name);
        return;
      }
    }
    setIsEditing(false);
    setEditingNodeId(null);
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      await handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(node.name);
      setEditingNodeId(null);
    }
  };

  const handleBlur = () => {
    handleRename();
  };

  const handleFileClick = async (e) => {
    console.log('=== CLICK EVENT FIRED ===');
    console.log('File clicked:', node.name, 'isFolder:', isFolder, 'onFileSelect:', !!onFileSelect);
    console.log('Node ID:', node.id);
    console.log('Event:', e);
    
    // Only handle file clicks, not folder clicks
    if (!isFolder && onFileSelect) {
      try {
        console.log('[TreeNode] Reading file with ID:', node.id);
        const fileData = await onFileSelect(node.id);
        console.log('[TreeNode] File data received:', fileData);
        
        if (!window.updateMonacoContent) {
          console.error('[TreeNode] window.updateMonacoContent not available!');
          alert('Editor not initialized. Please refresh the page.');
          return;
        }
        
        if (!window.monacoEditor) {
          console.error('[TreeNode] window.monacoEditor not available!');
          alert('Monaco editor not ready. Please refresh the page.');
          return;
        }
        
        console.log('[TreeNode] Updating Monaco editor with content');
        window.updateMonacoContent(fileData.content, fileData.fileName);
        console.log('[TreeNode] Monaco editor updated successfully');
      } catch (error) {
        console.error('[TreeNode] Error loading file:', error);
        alert('Failed to load file: ' + error.message);
      }
    } else {
      console.log('Skipping click - isFolder:', isFolder, 'onFileSelect available:', !!onFileSelect);
    }
  };
  
  const handleTestClick = () => {
    console.log('=== TEST CLICK WORKING ===', node.name);
  };

  const isActive = !isFolder && activeFilePath === node.id;
  const isActiveFolder = isFolder && activeFilePath && activeFilePath.startsWith(node.id + '/');

  return React.createElement("div", { className: "tree-node" },
    React.createElement("div", {
      className: `node-content ${isActive ? 'active-file' : ''} ${isActiveFolder ? 'active-folder' : ''}`,
      style: { paddingLeft: `${level * 20 + 8}px` },
      onMouseEnter: () => setShowActions(true),
      onMouseLeave: () => setShowActions(false)
    },
      React.createElement("span", {
        className: "chevron-container",
        onClick: handleToggle
      },
        hasChildren && (
          isOpen 
            ? React.createElement(Icons.ChevronDown, { className: "icon icon-gray" })
            : React.createElement(Icons.ChevronRight, { className: "icon icon-gray" })
        )
      ),
      React.createElement("span", {
        onClick: handleFileClick,
        style: { cursor: !isFolder ? 'pointer' : 'default' }
      },
        isFolder 
          ? (node.name === '.trash' 
              ? React.createElement(Icons.Trash2, { className: "icon icon-trash-folder" })
              : React.createElement(Icons.Folder, { className: "icon icon-folder" }))
          : React.createElement(Icons.File, { className: "icon icon-file" })
      ),
      isEditing 
        ? React.createElement("input", {
            type: "text",
            value: editName,
            onChange: (e) => setEditName(e.target.value),
            onKeyDown: handleKeyPress,
            onBlur: handleBlur,
            onFocus: (e) => e.target.select(),
            className: "node-name-input",
            autoFocus: true,
            onClick: (e) => e.stopPropagation()
          })
        : React.createElement("span", { 
            className: "node-name", 
            onDoubleClick: handleDoubleClick,
            onClick: handleFileClick,
            style: { cursor: !isFolder ? 'pointer' : 'default' }
          }, node.name),
      showActions && !isTrashFolder && React.createElement("div", { className: "actions" },
        isInTrash ? [
          // Buttons for items inside .trash folder
          React.createElement("button", {
            key: "restore",
            onClick: async () => {
              try {
                await restoreFromTrash(node.id, node);
              } catch (error) {
                console.error('Failed to restore:', error);
              }
            },
            className: "action-btn restore-action",
            title: "Restore from trash"
          }, React.createElement(Icons.Upload, { className: "icon-small icon-green" })),
          React.createElement("button", {
            key: "permanent-delete",
            onClick: () => onDelete(node.id),
            className: "action-btn delete-action",
            title: "Permanent delete"
          }, React.createElement(Icons.Trash2, { className: "icon-small icon-red" }))
        ] : [
          // Normal buttons for regular items
          // Don't show add folder/file buttons for .trash folder or items inside trash
          ...(isFolder && !isTrashFolder && !isInTrash ? [
            React.createElement("button", {
              key: "folder",
              onClick: async () => {
                try {
                  await onAddFolder(node.id);
                } catch (error) {
                  console.error('Failed to add folder:', error);
                }
              },
              className: "action-btn folder-action",
              title: "Add folder"
            }, React.createElement(Icons.FolderPlus, { className: "icon-small icon-blue-dark" })),
            React.createElement("button", {
              key: "file",
              onClick: async () => {
                try {
                  await onAddFile(node.id);
                } catch (error) {
                  console.error('Failed to add file:', error);
                }
              },
              className: "action-btn file-action",
              title: "Add file"
            }, React.createElement(Icons.FilePlus, { className: "icon-small icon-green" }))
          ] : []),
          React.createElement("button", {
            key: "move-to-trash",
            onClick: () => moveToTrash(node.id),
            className: "action-btn trash-action",
            title: "Move to trash"
          }, React.createElement(Icons.Trash2, { className: "icon-small icon-red" }))
        ]
      )
    ),
    hasChildren && isOpen && React.createElement("div", null,
      node.children.map((child) =>
        React.createElement(TreeNode, {
          key: child.id,
          node: child,
          level: level + 1,
          onDelete: onDelete,
          onAddFolder: onAddFolder,
          onAddFile: onAddFile,
          onRename: onRename,
          editingNodeId: editingNodeId,
          setEditingNodeId: setEditingNodeId,
          moveToTrash: moveToTrash,
          restoreFromTrash: restoreFromTrash,
          onFileSelect: onFileSelect,
          activeFilePath: activeFilePath
        })
      )
    )
  );
};

// Make TreeNode available globally
window.TreeNode = TreeNode;
