# Excel Key Extractor

A React application that allows you to upload Excel files, extract keys from cells, and download the results as JSON.

## Features

- 🚀 **Drag & Drop Upload**: Easy file upload interface with drag-and-drop support
- 📊 **Excel File Support**: Supports both .xlsx and .xls file formats
- 🔍 **Smart Key Detection**: Automatically detects potential keys from headers and cells
- 📝 **JSON Export**: Download extracted keys with metadata as JSON
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Key Detection Logic

The application identifies potential keys by looking for:

- Header row values (first row of each sheet)
- Strings containing underscores (\_) or hyphens (-)
- Strings in ALL_CAPS format
- Any string that matches common key patterns

## How to Use

1. **Upload File**: Drag and drop your Excel file or click to browse
2. **Extract Keys**: Click the "Extract Keys" button to analyze the file
3. **Review Results**: Browse through the extracted keys with search functionality
4. **Download JSON**: Export the results as a JSON file with all data

## Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Dependencies

- **React** (v19.1.1) - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **xlsx** - Excel file parsing
- **file-saver** - File download functionality

## Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx    # File upload component with drag-and-drop
│   └── KeysList.tsx      # Keys display with search and copy features
├── App.tsx               # Main application component
├── index.tsx             # Application entry point
└── index.css             # Global styles with Tailwind directives
```

## Output Format

The JSON output includes:

- Original file name
- Extraction timestamp
- Total number of keys found
- Array of all extracted keys
- Raw Excel data for reference

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License
