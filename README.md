# File Tree Explorer

A modern, interactive file tree explorer built with vanilla React that leverages the File System Access API to provide seamless file and folder management directly in the browser.

![File Tree Explorer](https://img.shields.io/badge/React-18.x-blue)
![File System Access API](https://img.shields.io/badge/File%20System%20Access%20API-Supported-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **🗂️ Real File System Integration**: Connect to actual directories on your computer
- **📁 File & Folder Operations**: Create, rename, and delete files and folders
- **🎯 Intuitive Interface**: Clean, modern UI with collapsible tree structure
- **⚡ Real-time Updates**: Automatic synchronization with file system changes
- **🔒 Secure**: Uses browser's native File System Access API
- **📱 Responsive**: Works on desktop browsers with File System Access API support
- **🎨 Elegant Status Messages**: Subtle feedback for all operations
- **🛡️ Error Handling**: Comprehensive error boundaries and validation
- **🐍 Flask Backend**: Python Flask backend ready for API extensions

## 🚀 Demo

[Live Demo](https://manibpandian.github.io/file-tree-explorer/)

## 📋 Prerequisites

- Modern browser with File System Access API support:
  - Chrome 86+
  - Edge 86+
  - Opera 72+
- Local web server (for development)

## 🛠️ Installation

### Option 1: Flask Development Server (Recommended)
```bash
# Clone the repository
git clone https://github.com/manibpandian/MyLaTeX.git
cd MyLaTeX

# Install dependencies
pip install -r requirements.txt

# Run the Flask app
python app.py

# Open http://localhost:5000 in your browser
```

### Option 2: Docker 🐳 (Production Ready)
```bash
# Clone the repository
git clone https://github.com/manibpandian/MyLaTeX.git
cd MyLaTeX

# Build and run with Docker Compose
docker-compose up -d

# Open http://localhost:5000 in your browser

# View logs
docker-compose logs -f

# To stop the container
docker-compose down
```

### Option 3: Static Server (No Backend)
```bash
# Serve with Python
python -m http.server 8000
# OR with Node.js
npx serve static

# Open http://localhost:8000 in your browser
```
