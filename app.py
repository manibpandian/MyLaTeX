from flask import Flask, request, jsonify, send_from_directory, send_file
import os
import json
from pathlib import Path
import subprocess
import tempfile
import shutil
from io import BytesIO

app = Flask(__name__, static_folder='static', static_url_path='')

# Documents directory path
DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), 'documents')
TRASH_DIR = os.path.join(DOCUMENTS_DIR, '.trash')
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), 'templates')

# Ensure documents directory exists
if not os.path.exists(DOCUMENTS_DIR):
    os.makedirs(DOCUMENTS_DIR)

# Ensure trash directory exists
if not os.path.exists(TRASH_DIR):
    os.makedirs(TRASH_DIR)

# Ensure templates directory exists
if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)

@app.route('/')
def index():
    """Serve the main index.html"""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

# API endpoints for future backend functionality
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'file-tree-explorer'
    })

# Documents API endpoints
@app.route('/api/documents/tree', methods=['GET'])
def get_documents_tree():
    """Get the file tree structure of documents directory"""
    try:
        def build_tree(directory, parent_path=''):
            tree = []
            for item in sorted(os.listdir(directory)):
                # Show .trash folder, but hide other hidden files
                if item.startswith('.') and item != '.trash':
                    continue
                item_path = os.path.join(directory, item)
                rel_path = os.path.relpath(item_path, DOCUMENTS_DIR)
                
                if os.path.isdir(item_path):
                    tree.append({
                        'id': rel_path,
                        'name': item,
                        'children': build_tree(item_path, rel_path)
                    })
                else:
                    tree.append({
                        'id': rel_path,
                        'name': item
                    })
            return tree
        
        tree = build_tree(DOCUMENTS_DIR)
        return jsonify({
            'success': True,
            'tree': tree,
            'root': DOCUMENTS_DIR
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/read/<path:filepath>', methods=['GET'])
def read_document(filepath):
    """Read a document file"""
    try:
        full_path = os.path.join(DOCUMENTS_DIR, filepath)
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return 'File not found', 404
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
    except Exception as e:
        return str(e), 500

@app.route('/api/documents/write', methods=['POST'])
def write_document():
    """Write/create a document file"""
    try:
        data = request.get_json()
        filepath = data.get('path')
        content = data.get('content', '')
        
        if not filepath:
            return jsonify({'success': False, 'error': 'Path is required'}), 400
        
        full_path = os.path.join(DOCUMENTS_DIR, filepath)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({'success': True, 'message': 'File written successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/trash/<path:filepath>', methods=['POST'])
def move_to_trash(filepath):
    """Move a document file or directory to trash"""
    try:
        import shutil
        from datetime import datetime
        import json
        
        full_path = os.path.join(DOCUMENTS_DIR, filepath)
        if not os.path.exists(full_path):
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        # Create unique trash name with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = os.path.basename(filepath)
        trash_name = f"{filename}_{timestamp}"
        trash_path = os.path.join(TRASH_DIR, trash_name)
        
        # Load or create trash metadata
        trash_info_path = os.path.join(TRASH_DIR, 'trash-info.json')
        trash_info = {'items': []}
        if os.path.exists(trash_info_path):
            with open(trash_info_path, 'r') as f:
                trash_info = json.load(f)
        
        # Store metadata
        trash_info['items'].append({
            'trashFileName': trash_name,
            'originalName': filename,
            'originalPath': filepath,
            'deletedAt': datetime.now().isoformat(),
            'type': 'directory' if os.path.isdir(full_path) else 'file'
        })
        
        # Save metadata
        with open(trash_info_path, 'w') as f:
            json.dump(trash_info, f, indent=2)
        
        # Move to trash
        shutil.move(full_path, trash_path)
        
        return jsonify({'success': True, 'message': 'Moved to trash successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/delete/<path:filepath>', methods=['DELETE'])
def delete_document(filepath):
    """Delete a document file or directory permanently"""
    try:
        full_path = os.path.join(DOCUMENTS_DIR, filepath)
        if not os.path.exists(full_path):
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        if os.path.isfile(full_path):
            os.remove(full_path)
        else:
            import shutil
            shutil.rmtree(full_path)
        
        return jsonify({'success': True, 'message': 'Deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/mkdir', methods=['POST'])
def create_directory():
    """Create a new directory"""
    try:
        data = request.get_json()
        dirpath = data.get('path')
        
        if not dirpath:
            return jsonify({'success': False, 'error': 'Path is required'}), 400
        
        full_path = os.path.join(DOCUMENTS_DIR, dirpath)
        os.makedirs(full_path, exist_ok=True)
        
        # Check if this is a root-level folder (no parent folders except documents)
        # dirpath like 'NewFolder' is root level, 'folder1/NewFolder' is nested
        is_root_level = '/' not in dirpath
        
        # Copy template files only for root-level folders
        if is_root_level:
            import shutil
            
            print(f"[mkdir] Copying templates for root-level folder: {dirpath}")
            
            # Copy main.tex template
            main_tex_template = os.path.join(TEMPLATES_DIR, 'main.tex')
            print(f"[mkdir] Looking for template at: {main_tex_template}")
            print(f"[mkdir] Template exists: {os.path.exists(main_tex_template)}")
            
            if os.path.exists(main_tex_template):
                dest_path = os.path.join(full_path, 'main.tex')
                shutil.copy(main_tex_template, dest_path)
                print(f"[mkdir] Copied main.tex to: {dest_path}")
                print(f"[mkdir] Destination file size: {os.path.getsize(dest_path)} bytes")
            else:
                print(f"[mkdir] WARNING: main.tex template not found!")
            
            # Copy Makefile template
            makefile_template = os.path.join(TEMPLATES_DIR, 'Makefile')
            if os.path.exists(makefile_template):
                shutil.copy(makefile_template, os.path.join(full_path, 'Makefile'))
                print(f"[mkdir] Copied Makefile")
            else:
                print(f"[mkdir] WARNING: Makefile template not found!")
        
        return jsonify({'success': True, 'message': 'Directory created successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/rename', methods=['POST'])
def rename_document():
    """Rename a document file or directory"""
    try:
        data = request.get_json()
        old_path = data.get('oldPath')
        new_name = data.get('newName')
        
        if not old_path or not new_name:
            return jsonify({'success': False, 'error': 'oldPath and newName are required'}), 400
        
        # Get the parent directory and construct new path
        old_full_path = os.path.join(DOCUMENTS_DIR, old_path)
        parent_dir = os.path.dirname(old_full_path)
        new_full_path = os.path.join(parent_dir, new_name)
        
        if not os.path.exists(old_full_path):
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        if os.path.exists(new_full_path):
            return jsonify({'success': False, 'error': f'An item named "{new_name}" already exists'}), 400
        
        # Rename (works for both files and directories)
        os.rename(old_full_path, new_full_path)
        
        return jsonify({'success': True, 'message': 'Renamed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/compile/<path:filepath>', methods=['POST'])
def compile_latex(filepath):
    """Compile a LaTeX file and return the PDF"""
    try:
        # Get the full path to the .tex file
        full_path = os.path.join(DOCUMENTS_DIR, filepath)
        
        if not os.path.exists(full_path):
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        if not filepath.endswith('.tex'):
            return jsonify({'success': False, 'error': 'Not a LaTeX file'}), 400
        
        # Read the LaTeX content
        with open(full_path, 'r', encoding='utf-8') as f:
            tex_content = f.read()
        
        # Create a temporary directory for compilation
        temp_dir = tempfile.mkdtemp()
        latex_file = os.path.join(temp_dir, 'main.tex')
        pdf_file = os.path.join(temp_dir, 'main.pdf')
        
        # Write LaTeX content to temp file
        with open(latex_file, 'w', encoding='utf-8') as f:
            f.write(tex_content)
        
        # Compile LaTeX (run twice for references)
        for _ in range(2):
            result = subprocess.run(
                ['pdflatex', '-shell-escape', '-interaction=nonstopmode', 
                 '-halt-on-error', '-output-directory', temp_dir, latex_file],
                capture_output=True,
                text=True,
                timeout=30
            )
        
        # Check if PDF was created
        if not os.path.exists(pdf_file):
            log_file = os.path.join(temp_dir, 'main.log')
            error_msg = "Compilation failed. No PDF generated."
            error_details = []
            
            if os.path.exists(log_file):
                with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                    log_content = f.read()
                    lines = log_content.split('\n')
                    
                    # Look for error context
                    for i, line in enumerate(lines):
                        if line.startswith('!'):
                            # Found an error line, get context
                            error_details.append(line)
                            # Get next few lines for context
                            for j in range(i+1, min(i+5, len(lines))):
                                if lines[j].strip():
                                    error_details.append(lines[j])
                                if lines[j].startswith('l.'):
                                    break
                    
                    if error_details:
                        error_msg = '\n'.join(error_details[:15])
                    else:
                        # Fallback: show last 20 lines of log
                        error_msg = '\n'.join(lines[-20:])
            
            shutil.rmtree(temp_dir, ignore_errors=True)
            return jsonify({'success': False, 'error': error_msg}), 500
        
        # Read PDF file into memory
        with open(pdf_file, 'rb') as f:
            pdf_data = f.read()
        
        # Clean up temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        # Send PDF from memory
        return send_file(
            BytesIO(pdf_data),
            mimetype='application/pdf',
            as_attachment=False,
            download_name='output.pdf'
        )
        
    except subprocess.TimeoutExpired:
        shutil.rmtree(temp_dir, ignore_errors=True)
        return jsonify({'success': False, 'error': 'Compilation timed out (took more than 30 seconds)'}), 500
    except FileNotFoundError:
        return jsonify({'success': False, 'error': 'pdflatex not found. Please install TeX Live.'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/restore/<path:filepath>', methods=['POST'])
def restore_from_trash(filepath):
    """Restore a file from trash to its original location"""
    try:
        import shutil
        import json
        
        # filepath should be like '.trash/filename_timestamp'
        full_trash_path = os.path.join(DOCUMENTS_DIR, filepath)
        
        if not os.path.exists(full_trash_path):
            return jsonify({'success': False, 'error': 'File not found in trash'}), 404
        
        # Load trash metadata
        trash_info_path = os.path.join(TRASH_DIR, 'trash-info.json')
        if not os.path.exists(trash_info_path):
            return jsonify({'success': False, 'error': 'Trash metadata not found'}), 404
        
        with open(trash_info_path, 'r') as f:
            trash_info = json.load(f)
        
        # Find the item in metadata
        trash_filename = os.path.basename(filepath)
        item_info = None
        for item in trash_info['items']:
            if item['trashFileName'] == trash_filename:
                item_info = item
                break
        
        if not item_info:
            return jsonify({'success': False, 'error': 'Item metadata not found'}), 404
        
        # Restore to original path
        original_path = item_info['originalPath']
        restore_full_path = os.path.join(DOCUMENTS_DIR, original_path)
        
        # Ensure parent directory exists
        parent_dir = os.path.dirname(restore_full_path)
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)
        
        # If file exists at original location, add suffix
        final_restore_path = restore_full_path
        if os.path.exists(restore_full_path):
            base, ext = os.path.splitext(original_path)
            counter = 1
            while os.path.exists(final_restore_path):
                new_name = f"{base}_restored{counter}{ext}"
                final_restore_path = os.path.join(DOCUMENTS_DIR, new_name)
                counter += 1
        
        # Move from trash to original location
        shutil.move(full_trash_path, final_restore_path)
        
        # Remove from metadata
        trash_info['items'] = [item for item in trash_info['items'] if item['trashFileName'] != trash_filename]
        with open(trash_info_path, 'w') as f:
            json.dump(trash_info, f, indent=2)
        
        return jsonify({'success': True, 'message': 'Restored successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("File Tree Explorer")
    print("="*50)
    print("Open: http://localhost:5000")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
