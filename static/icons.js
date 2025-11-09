
const Icons = {
  Menu: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" })
    )
  ),
  
  ChevronRight: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
    )
  ),
  
  ChevronDown: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" })
    )
  ),
  
  Folder: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" })
    )
  ),
  
  File: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" })
    )
  ),
  
  Trash2: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
    )
  ),
  
  FolderPlus: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 10v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" })
    )
  ),
  
  FilePlus: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })
    )
  ),
  
  Download: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" })
    )
  ),
  
  Upload: ({ className }) => (
    React.createElement("svg", { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
      React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" })
    )
  )
};