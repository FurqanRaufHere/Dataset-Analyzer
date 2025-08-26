from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from src.groq_client import get_groq_client
from src.dataset_loader import load_dataset
from src.qa_engine import ask_dataset
import os
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'json'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Groq client
groq_client = get_groq_client()

# Store loaded datasets in memory (in production, use a proper cache)
loaded_datasets = {}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def serve_frontend():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        # Check file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False, 
                'message': 'Invalid file type. Please upload CSV, Excel, or JSON files.'
            }), 400
        
        # Secure filename and create unique path
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")
        
        # Save file
        file.save(file_path)
        
        try:
            # Load dataset
            df = load_dataset(file_path)
            
            # Store dataset in memory
            loaded_datasets[file_id] = {
                'dataframe': df,
                'filename': filename,
                'conversation_memory': []
            }
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'filename': filename,
                'message': 'File uploaded successfully'
            })
            
        except Exception as e:
            # Clean up file if loading fails
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({
                'success': False,
                'message': f'Error loading dataset: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/ask', methods=['POST'])
def ask_question():
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({'success': False, 'message': 'No question provided'}), 400
        
        question = data['question'].strip()
        memory = data.get('memory', [])
        
        if not question:
            return jsonify({'success': False, 'message': 'Question cannot be empty'}), 400
        
        # For simplicity, we'll use the first file in memory
        # In a real application, you'd track which file the user is working with
        if not loaded_datasets:
            return jsonify({'success': False, 'message': 'No dataset loaded'}), 400
        
        # Get the first dataset (in production, track user sessions)
        file_id, dataset_info = next(iter(loaded_datasets.items()))
        df = dataset_info['dataframe']
        
        try:
            # Ask question using the QA engine
            answer = ask_dataset(question, df, groq_client, memory)
            
            return jsonify({
                'success': True,
                'answer': answer,
                'file_id': file_id
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error processing question: {str(e)}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """Get list of currently loaded datasets"""
    datasets = []
    for file_id, info in loaded_datasets.items():
        datasets.append({
            'file_id': file_id,
            'filename': info['filename'],
            'rows': len(info['dataframe']),
            'columns': list(info['dataframe'].columns)
        })
    
    return jsonify({'success': True, 'datasets': datasets})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'groq_connected': groq_client is not None,
        'loaded_datasets': len(loaded_datasets)
    })

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'success': False,
        'message': 'File too large. Maximum size is 16MB.'
    }), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("Starting Dataset Analyzer API Server...")
    print("Available endpoints:")
    print("  GET  /              - Frontend interface")
    print("  POST /api/upload    - Upload dataset file")
    print("  POST /api/ask       - Ask question about dataset")
    print("  GET  /api/datasets  - List loaded datasets")
    print("  GET  /api/health    - Health check")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
