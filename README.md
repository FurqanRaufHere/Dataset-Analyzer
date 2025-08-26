<<<<<<< HEAD
# Dataset Analyzer

A modern, elegant web application for analyzing datasets with AI-powered question answering capabilities. Upload your datasets and ask intelligent questions to gain insights.

## Features

- **Modern UI**: Beautiful, responsive interface with gradient designs and smooth animations
- **File Upload**: Support for CSV, Excel, and JSON files with drag-and-drop functionality
- **AI-Powered Analysis**: Integration with Groq AI for intelligent dataset questioning
- **Conversation Memory**: Maintains context throughout your analysis session
- **Real-time Chat**: Interactive chat interface for asking questions about your data
- **Code Formatting**: Proper formatting for code blocks, lists, and structured responses

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Modern CSS with gradients and animations
- Font Awesome icons
- Responsive design

### Backend
- Python Flask
- Flask-CORS for cross-origin requests
- Pandas for data manipulation
- Groq API integration

## Installation

1. Clone the repository:
```bash
git clone https://github.com/FurqanRaufHere/Dataset-Analyzer.git
cd dataset-analyzer
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your Groq API key:
   - Create a `.env` file in the root directory
   - Add your Groq API key: `API_KEY=your_api_key_here`

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to `http://localhost:5000`

## Usage

1. **Upload Dataset**: Click or drag-and-drop your dataset file (CSV, Excel, or JSON)
2. **Ask Questions**: Once uploaded, use the chat interface to ask questions about your data
3. **Get Insights**: The AI will analyze your dataset and provide detailed answers
4. **Start Over**: Use the "New Dataset" button to analyze a different file

## Supported File Formats

- CSV (.csv)
- Excel (.xlsx, .xls)
- JSON (.json)

## API Endpoints

- `GET /` - Serve frontend interface
- `POST /api/upload` - Upload dataset file
- `POST /api/ask` - Ask question about dataset
- `GET /api/datasets` - List loaded datasets
- `GET /api/health` - Health check endpoint

## Project Structure



## Environment Variables

Create a `.env` file with the following variables:

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Groq for AI API services
- Flask framework
- Font Awesome for icons
- Pandas for data manipulation
=======
# Dataset-Analyzer
>>>>>>> 724f60e8ea694744048e936959eaec5a9926e9af
