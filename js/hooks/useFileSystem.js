const { useState } = React;

// Custom hook for all filesystem operations
const useFileSystem = (addNotification) => {
  const [directoryHandles, setDirectoryHandles] = useState(new Map());
  const [rootDirectoryHandle, setRootDirectoryHandle] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [operationLoading, setOperationLoading] = useState(null);

  // Helper function to copy directory contents recursively
  const copyDirectoryContents = async (sourceDir, targetDir) => {
    for await (const [name, handle] of sourceDir.entries()) {
      if (handle.kind === 'directory') {
        const newSubDir = await targetDir.getDirectoryHandle(name, { create: true });
        await copyDirectoryContents(handle, newSubDir);
      } else {
        const file = await handle.getFile();
        const content = await file.text();
        const newFileHandle = await targetDir.getFileHandle(name, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      }
    }
  };

  // Helper function to log trash item metadata
  const logTrashItem = async (trashItem) => {
    try {
      const trashHandle = await rootDirectoryHandle.getDirectoryHandle('.trash');
      let trashInfo = { items: [] };
      
      try {
        const infoFileHandle = await trashHandle.getFileHandle('trash-info.json');
        const file = await infoFileHandle.getFile();
        const content = await file.text();
        trashInfo = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, use empty structure
      }
      
      trashInfo.items.push({
        id: Date.now() + Math.random(),
        ...trashItem
      });
      
      const infoFileHandle = await trashHandle.getFileHandle('trash-info.json', { create: true });
      const writable = await infoFileHandle.createWritable();
      await writable.write(JSON.stringify(trashInfo, null, 2));
      await writable.close();
    } catch (error) {
      console.warn('Failed to log trash item:', error);
    }
  };

  // Helper function to generate unique name for conflicts (macOS style)
  const getMacOSStyleName = async (parentHandle, originalName) => {
    try {
      await parentHandle.getFileHandle(originalName).catch(async () => {
        return await parentHandle.getDirectoryHandle(originalName);
      });
      
      const nameParts = originalName.split('.');
      const extension = nameParts.length > 1 ? '.' + nameParts.pop() : '';
      const baseName = nameParts.join('.');
      
      let counter = 2;
      let newName = `${baseName}_restored${counter}${extension}`;
      
      while (true) {
        try {
          await parentHandle.getFileHandle(newName).catch(async () => {
            return await parentHandle.getDirectoryHandle(newName);
          });
          counter++;
          newName = `${baseName}_restored${counter}${extension}`;
        } catch (error) {
          break;
        }
      }
      
      return newName;
    } catch (error) {
      return originalName;
    }
  };

  // Helper function to validate parent directory exists (macOS style - strict)
  const validateParentExists = async (fullPath) => {
    const pathParts = fullPath.split('/');
    let currentHandle = rootDirectoryHandle;
    
    for (let i = 1; i < pathParts.length - 1; i++) {
      const dirName = pathParts[i];
      try {
        currentHandle = await currentHandle.getDirectoryHandle(dirName);
      } catch (error) {
        throw new Error(`The item can't be put back because the original folder "${pathParts.slice(0, i + 1).join('/')}" no longer exists.`);
      }
    }
    
    return currentHandle;
  };

  // Recursively build tree structure from directory handle
  const buildTreeFromDirectory = async (dirHandle, path = '', handleMap) => {
    const children = [];
    const currentPath = path || dirHandle.name;
    
    handleMap.set(currentPath, dirHandle);
    
    let trashInfo = null;
    if (dirHandle.name === '.trash' || currentPath.endsWith('/.trash')) {
      try {
        const infoFileHandle = await dirHandle.getFileHandle('trash-info.json');
        const file = await infoFileHandle.getFile();
        const content = await file.text();
        trashInfo = JSON.parse(content);
      } catch (error) {
        // No trash info file, continue normally
      }
    }
    
    for await (const [name, handle] of dirHandle.entries()) {
      if (name.startsWith('.') && name !== '.trash') {
        continue;
      }
      
      if (name === 'trash-info.json') {
        continue;
      }
      
      const id = `${currentPath}/${name}`;
      let displayName = name;
      
      if (trashInfo && trashInfo.items) {
        const trashItem = trashInfo.items.find(item => item.trashFileName === name);
        if (trashItem) {
          const pathParts = trashItem.originalPath.split('/');
          displayName = pathParts.slice(2).join('/') || trashItem.originalName;
        }
      }
      
      if (handle.kind === 'directory') {
        handleMap.set(id, handle);
        const subChildren = await buildTreeFromDirectory(handle, id, handleMap);
        children.push({
          id,
          name: displayName,
          originalName: name,
          children: subChildren.children || []
        });
      } else {
        children.push({
          id,
          name: displayName,
          originalName: name
        });
      }
    }
    
    children.sort((a, b) => {
      if (a.name === '.trash') return 1;
      if (b.name === '.trash') return -1;
      return a.name.localeCompare(b.name);
    });
    
    return {
      id: currentPath,
      name: dirHandle.name,
      children
    };
  };

  // Load real directory structure
  const loadRealDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker({
          mode: 'readwrite'
        });
        
        const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          alert('Write permission is required to create/delete files and folders.');
          return null;
        }
        
        try {
          await dirHandle.getDirectoryHandle('.trash', { create: true });
        } catch (error) {
          console.warn('Could not create .trash folder:', error);
        }
        
        const handleMap = new Map();
        const treeStructure = await buildTreeFromDirectory(dirHandle, dirHandle.name, handleMap);
        
        setDirectoryHandles(handleMap);
        setRootDirectoryHandle(dirHandle);
        
        return treeStructure.children || [];
      } else {
        alert('File System Access API not supported in this browser. Try Chrome/Edge.');
        return null;
      }
    } catch (error) {
      console.error('Error loading directory:', error);
      if (error.name !== 'AbortError') {
        alert('Failed to load directory: ' + error.message);
      }
      return null;
    }
  };

  // Refresh the tree structure from filesystem
  const refreshTreeStructure = async () => {
    if (!rootDirectoryHandle || isRefreshing) {
      return null;
    }

    setIsRefreshing(true);

    try {
      setDirectoryHandles(new Map());
      
      const handleMap = new Map();
      const treeStructure = await buildTreeFromDirectory(rootDirectoryHandle, rootDirectoryHandle.name, handleMap);
      
      setDirectoryHandles(handleMap);
      return treeStructure.children || [];
    } catch (error) {
      console.error('Error refreshing tree structure:', error);
      alert('Failed to refresh directory structure: ' + error.message);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Move node to trash
  const moveRealNodeToTrash = async (nodeId) => {
    const pathParts = nodeId.split('/');
    const itemName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');
    
    const parentHandle = directoryHandles.get(parentPath);
    if (!parentHandle) {
      throw new Error('Parent directory not found');
    }

    const trashHandle = await rootDirectoryHandle.getDirectoryHandle('.trash', { create: true });
    
    const itemHandle = await parentHandle.getFileHandle(itemName).catch(async () => {
      return await parentHandle.getDirectoryHandle(itemName);
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const trashName = `${itemName}_${timestamp}`;
    
    if (itemHandle.kind === 'file') {
      const file = await itemHandle.getFile();
      const trashFileHandle = await trashHandle.getFileHandle(trashName, { create: true });
      const writable = await trashFileHandle.createWritable();
      await writable.write(file);
      await writable.close();
    } else {
      const trashDirHandle = await trashHandle.getDirectoryHandle(trashName, { create: true });
      await copyDirectoryContents(itemHandle, trashDirHandle);
    }
    
    await logTrashItem({
      trashFileName: trashName,
      originalName: itemName,
      originalPath: nodeId,
      deletedAt: new Date().toISOString(),
      type: itemHandle.kind
    });
    
    await parentHandle.removeEntry(itemName, { recursive: true });
    
    if (directoryHandles.has(nodeId)) {
      const newHandleMap = new Map(directoryHandles);
      newHandleMap.delete(nodeId);
      setDirectoryHandles(newHandleMap);
    }

    return await refreshTreeStructure();
  };

  // Restore from trash
  const restoreFromTrash = async (trashNodeId, node = null) => {
    try {
      const trashHandle = await rootDirectoryHandle.getDirectoryHandle('.trash');
      
      const infoFileHandle = await trashHandle.getFileHandle('trash-info.json');
      const file = await infoFileHandle.getFile();
      const trashInfo = JSON.parse(await file.text());
      
      const trashFileName = node && node.originalName ? node.originalName : trashNodeId.split('/').pop();
      const itemInfo = trashInfo.items.find(item => item.trashFileName === trashFileName);
      
      if (!itemInfo) {
        throw new Error('Item not found in trash metadata');
      }
      
      const parentHandle = await validateParentExists(itemInfo.originalPath);
      const restoredName = await getMacOSStyleName(parentHandle, itemInfo.originalName);
      
      const trashItemHandle = await trashHandle.getFileHandle(trashFileName).catch(async () => {
        return await trashHandle.getDirectoryHandle(trashFileName);
      });
      
      if (trashItemHandle.kind === 'file') {
        const file = await trashItemHandle.getFile();
        const restoredFileHandle = await parentHandle.getFileHandle(restoredName, { create: true });
        const writable = await restoredFileHandle.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        const restoredDirHandle = await parentHandle.getDirectoryHandle(restoredName, { create: true });
        await copyDirectoryContents(trashItemHandle, restoredDirHandle);
      }
      
      await trashHandle.removeEntry(trashFileName, { recursive: true });
      
      trashInfo.items = trashInfo.items.filter(item => item.trashFileName !== trashFileName);
      const writable = await infoFileHandle.createWritable();
      await writable.write(JSON.stringify(trashInfo, null, 2));
      await writable.close();
      
      const newTree = await refreshTreeStructure();
      
      addNotification(`Restored "${itemInfo.originalName}" as "${restoredName}"`, 'success');
      
      return newTree;
    } catch (error) {
      console.error('Error restoring from trash:', error);
      
      if (error.message.includes("original folder") && error.message.includes("no longer exists")) {
        const pathMatch = error.message.match(/"([^"]+)"/); 
        const missingPath = pathMatch ? pathMatch[1] : 'the original folder';
        
        addNotification(
          `Cannot restore: Missing folder "${missingPath}". Create this folder first or restore its parent folder from trash.`, 
          'error'
        );
      } else {
        addNotification(`Failed to restore: ${error.message}`, 'error');
      }
      
      throw error;
    }
  };

  // Delete node permanently
  const deleteRealNode = async (nodeId) => {
    const pathParts = nodeId.split('/');
    const itemName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');
    
    const parentHandle = directoryHandles.get(parentPath);
    if (!parentHandle) {
      throw new Error('Parent directory not found');
    }

    await parentHandle.removeEntry(itemName, { recursive: true });
    
    if (directoryHandles.has(nodeId)) {
      const newHandleMap = new Map(directoryHandles);
      newHandleMap.delete(nodeId);
      setDirectoryHandles(newHandleMap);
    }
  };

  // Add folder
  const addRealFolder = async (parentId, setOpenNodes, setEditingNodeId) => {
    const rootId = rootDirectoryHandle.name;
    const actualParentId = parentId === '' ? rootId : parentId;
    const parentHandle = parentId === '' ? rootDirectoryHandle : directoryHandles.get(parentId);
    
    if (!parentHandle) {
      throw new Error(`Parent directory not found for path: ${parentId}`);
    }

    const permission = await parentHandle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      throw new Error('Write permission denied');
    }

    const existingNames = [];
    try {
      for await (const [name] of parentHandle.entries()) {
        existingNames.push(name);
      }
    } catch (error) {
      console.error('Error reading parent directory:', error);
      throw new Error('Cannot read parent directory');
    }

    let folderName = 'NewFolder';
    let counter = 1;
    while (existingNames.includes(folderName)) {
      folderName = `NewFolder${counter}`;
      counter++;
    }

    try {
      await parentHandle.getDirectoryHandle(folderName, { create: true });
      const newFolderId = `${actualParentId}/${folderName}`;
      
      const newTree = await refreshTreeStructure();
      
      setTimeout(() => {
        setEditingNodeId(newFolderId);
        if (parentId !== '') {
          setOpenNodes(prev => ({ ...prev, [actualParentId]: true }));
        }
      }, 200);
      
      return newTree;
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  };

  // Add file
  const addRealFile = async (parentId, setOpenNodes, setEditingNodeId) => {
    const rootId = rootDirectoryHandle.name;
    const actualParentId = parentId === '' ? rootId : parentId;
    const parentHandle = parentId === '' ? rootDirectoryHandle : directoryHandles.get(parentId);
    
    if (!parentHandle) {
      throw new Error(`Parent directory not found for path: ${parentId}`);
    }

    const permission = await parentHandle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      throw new Error('Write permission denied');
    }

    const existingNames = [];
    try {
      for await (const [name] of parentHandle.entries()) {
        existingNames.push(name);
      }
    } catch (error) {
      console.error('Error reading parent directory:', error);
      throw new Error('Cannot read parent directory');
    }

    let fileName = 'NewFile.tex';
    let counter = 1;
    while (existingNames.includes(fileName)) {
      fileName = `NewFile${counter}.tex`;
      counter++;
    }

    try {
      const fileHandle = await parentHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write('% New LaTeX file\n\\documentclass{article}\n\\begin{document}\n\n\\end{document}');
      await writable.close();

      const newFileId = `${actualParentId}/${fileName}`;

      const newTree = await refreshTreeStructure();
      
      setTimeout(() => {
        setEditingNodeId(newFileId);
        if (parentId !== '') {
          setOpenNodes(prev => ({ ...prev, [actualParentId]: true }));
        }
      }, 200);
      
      return newTree;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw new Error(`Failed to create file: ${error.message}`);
    }
  };

  // Rename node
  const renameRealNode = async (nodeId, newName) => {
    const pathParts = nodeId.split('/');
    const oldName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');
    
    if (oldName === newName) {
      return null;
    }
    
    const parentHandle = directoryHandles.get(parentPath);
    if (!parentHandle) {
      throw new Error(`Parent directory not found for path: ${parentPath}`);
    }

    const existingNames = [];
    for await (const [name] of parentHandle.entries()) {
      existingNames.push(name);
    }
    
    if (existingNames.includes(newName)) {
      throw new Error(`An item named "${newName}" already exists`);
    }

    const oldHandle = await parentHandle.getFileHandle(oldName).catch(async () => {
      return await parentHandle.getDirectoryHandle(oldName);
    });

    if (oldHandle.kind === 'directory') {
      const newDirHandle = await parentHandle.getDirectoryHandle(newName, { create: true });
      const oldDirHandle = await parentHandle.getDirectoryHandle(oldName);
      
      await copyDirectoryContents(oldDirHandle, newDirHandle);
      await parentHandle.removeEntry(oldName, { recursive: true });
      
      const newNodeId = nodeId.replace(new RegExp(`/${oldName}$`), `/${newName}`);
      const newHandleMap = new Map(directoryHandles);
      
      for (const [path, handle] of directoryHandles.entries()) {
        if (path.startsWith(nodeId)) {
          const newPath = path.replace(nodeId, newNodeId);
          newHandleMap.delete(path);
          if (path === nodeId) {
            newHandleMap.set(newPath, newDirHandle);
          }
        }
      }
      
      setDirectoryHandles(newHandleMap);
    } else {
      const oldFileHandle = await parentHandle.getFileHandle(oldName);
      const file = await oldFileHandle.getFile();
      const content = await file.text();
      
      const newFileHandle = await parentHandle.getFileHandle(newName, { create: true });
      const writable = await newFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      await parentHandle.removeEntry(oldName);
    }

    return await refreshTreeStructure();
  };

  // Disconnect from directory
  const disconnectDirectory = () => {
    setRootDirectoryHandle(null);
    setDirectoryHandles(new Map());
    return [];
  };

  // Read file content for Monaco editor
  const readFileContent = async (filePath) => {
    if (!rootDirectoryHandle) {
      throw new Error('No directory connected');
    }

    try {
      let pathParts = filePath.split('/').filter(part => part);
      
      // Remove root directory name from path if it's duplicated
      if (pathParts.length > 0 && pathParts[0] === rootDirectoryHandle.name) {
        pathParts = pathParts.slice(1);
      }
      
      let currentHandle = rootDirectoryHandle;
      
      // Navigate to the file's directory
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
      }
      
      // Get the file
      const fileName = pathParts[pathParts.length - 1];
      const fileHandle = await currentHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      return {
        content,
        fileName,
        filePath
      };
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  };

  return {
    directoryHandles,
    rootDirectoryHandle,
    isRefreshing,
    operationLoading,
    setOperationLoading,
    loadRealDirectory,
    refreshTreeStructure,
    moveRealNodeToTrash,
    restoreFromTrash,
    deleteRealNode,
    addRealFolder,
    addRealFile,
    renameRealNode,
    disconnectDirectory,
    readFileContent
  };
};
