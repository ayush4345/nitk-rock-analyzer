# Rock Analyzer

A React application that analyzes rock images using OpenAI's Vision API to provide detailed information about rock properties.

## Features

- Drag and drop or select rock images for analysis
- Analyzes rock images using OpenAI's Vision API
- Provides structured information about:
  - Rock composition
  - Color
  - Hardness (Mohs scale)
  - Density
  - Formation process
  - Other notable properties
- Modern, responsive UI with image preview

## Prerequisites

- Node.js and npm installed
- OpenAI API key (GPT-4 Vision access required)

## Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Usage

1. Start the development server:

```bash
npm start
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Enter your OpenAI API key in the provided field
4. Upload a rock image by dragging and dropping or clicking to select
5. Click "Analyze Rock" to get detailed information about the rock

## Important Notes

- Your OpenAI API key is used only for the analysis request and is not stored
- You need access to the GPT-4 Vision API for this application to work
- The application requires an internet connection to communicate with the OpenAI API

## Technologies Used

- React.js
- react-dropzone for image upload
- Axios for API requests
- OpenAI GPT-4 Vision API

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## License

This project is open source and available under the MIT License.
