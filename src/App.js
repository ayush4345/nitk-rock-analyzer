import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from 'zod';
import './App.css';

// Define the rock analysis schema using Zod
const BaseRockSchema = {
  composition: z.string().describe("The mineral composition of the rock"),
  color: z.string().describe("The color(s) of the rock"),
  texture: z.string().describe("The texture of the rock"),
  hardness: z.string().describe("The hardness of the rock on the Mohs scale"),
  density: z.string().describe("The density of the rock"),
  formation: z.string().describe("The formation process of the rock"),
  otherProperties: z.string().describe("Any other notable properties of the rock")
};

// Rock type specific schemas
const RockSchemas = {
  granite: z.object({
    ...BaseRockSchema,
    rockType: z.literal("granite").describe("Granite rock type")
  }),
  
  limestone: z.object({
    ...BaseRockSchema,
    fossilContent: z.string().describe("Fossil content found in the limestone"),
    rockType: z.literal("limestone").describe("Limestone rock type")
  }),
  
  shale: z.object({
    ...BaseRockSchema,
    lamination: z.string().describe("Lamination characteristics of the shale"),
    beddingPlanes: z.string().describe("Bedding planes characteristics"),
    fossilContent: z.string().describe("Fossil content found in the shale"),
    rockType: z.literal("shale").describe("Shale rock type")
  }),
  
  slate: z.object({
    ...BaseRockSchema,
    cleavage: z.string().describe("Cleavage characteristics of the slate"),
    rockType: z.literal("slate").describe("Slate rock type")
  }),
  
  sandstone: z.object({
    ...BaseRockSchema,
    cementation: z.string().describe("Cementation characteristics of the sandstone"),
    beddingLayering: z.string().describe("Bedding/layering characteristics"),
    rockType: z.literal("sandstone").describe("Sandstone rock type")
  }),
  
  other: z.object({
    ...BaseRockSchema,
    rockType: z.string().describe("The type of rock")
  })
};

function App() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rockData, setRockData] = useState(null);
  const [rockType, setRockType] = useState("other");
  const [manualEntry, setManualEntry] = useState(false);
  const [formData, setFormData] = useState({});

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setRockData(null); // Clear previous results
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  const handleRockTypeChange = (e) => {
    setRockType(e.target.value);
    // Reset form data when rock type changes
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    // Add rockType to the form data
    const completeData = {
      ...formData,
      rockType: rockType
    };
    setRockData(completeData);
  };

  const analyzeRock = async () => {
    if (!image) {
      setError('Please upload an image first');
      return;
    }

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      setError('OpenAI API key not found in environment variables. Please check your .env file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];

        try {
          const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Required for client-side usage
          });

          // Use the appropriate schema based on selected rock type
          const currentSchema = RockSchemas[rockType];

          const response = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an expert geologist who analyzes rock images and provides detailed structured information about ${rockType} rocks.`
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this rock image and provide detailed information about this ${rockType} rock.`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            response_format: zodResponseFormat(currentSchema, "rock_analysis")
          });

          // The parsed response is already in the correct format
          const rockAnalysis = response.choices[0].message.parsed;
          console.log(rockAnalysis);
          
          // Set the rock data directly without additional parsing
          setRockData(rockAnalysis);
          setLoading(false);
        } catch (error) {
          console.error('Error analyzing rock:', error);
          setError(error.response?.data?.error?.message || error.message || 'Error analyzing rock. Please try again.');
          setLoading(false);
        }
      };
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Error reading file. Please try again.');
      setLoading(false);
    }
  };

  // Get field definitions based on rock type
  const getFieldsForRockType = () => {
    const fields = [
      { name: 'composition', label: 'Composition' },
      { name: 'color', label: 'Color' },
      { name: 'texture', label: 'Texture' },
      { name: 'hardness', label: 'Hardness' },
      { name: 'density', label: 'Density' },
      { name: 'formation', label: 'Formation' },
      { name: 'otherProperties', label: 'Other Properties' }
    ];

    // Add rock-specific fields
    switch (rockType) {
      case 'limestone':
        fields.push({ name: 'fossilContent', label: 'Fossil Content' });
        break;
      case 'shale':
        fields.push(
          { name: 'lamination', label: 'Lamination' },
          { name: 'beddingPlanes', label: 'Bedding Planes' },
          { name: 'fossilContent', label: 'Fossil Content' }
        );
        break;
      case 'slate':
        fields.push({ name: 'cleavage', label: 'Cleavage' });
        break;
      case 'sandstone':
        fields.push(
          { name: 'cementation', label: 'Cementation' },
          { name: 'beddingLayering', label: 'Bedding/Layering' }
        );
        break;
      default:
        break;
    }

    return fields;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Rock Analyzer</h1>
        <p>Upload a rock image to analyze its properties or enter details manually</p>
      </header>

      <main className="App-main">
        <div className="rock-type-selector">
          <h2>Select Rock Type</h2>
          <select 
            value={rockType} 
            onChange={handleRockTypeChange}
            className="rock-type-dropdown"
          >
            <option value="granite">Granite</option>
            <option value="limestone">Limestone</option>
            <option value="shale">Shale</option>
            <option value="slate">Slate</option>
            <option value="sandstone">Sandstone</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="entry-mode-toggle">
          <button 
            className={`toggle-button ${!manualEntry ? 'active' : ''}`}
            onClick={() => setManualEntry(false)}
          >
            Image Analysis
          </button>
          {/* <button 
            className={`toggle-button ${manualEntry ? 'active' : ''}`}
            onClick={() => setManualEntry(true)}
          >
            Manual Entry
          </button>	 */}
        </div>

        {!manualEntry ? (
          <div className="upload-section">
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <p>Drag and drop a rock image here, or click to select a file</p>
              )}
            </div>

            {imagePreview && (
              <div className="preview-container">
                <h3>Image Preview</h3>
                <img src={imagePreview} alt="Rock preview" className="image-preview" />
                <button
                  className="analyze-button"
                  onClick={analyzeRock}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Analyze Rock'}
                </button>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="manual-entry-section">
            <h2>Enter {rockType.charAt(0).toUpperCase() + rockType.slice(1)} Rock Details</h2>
            <form onSubmit={handleManualSubmit}>
              {getFieldsForRockType().map(field => (
                <div key={field.name} className="form-group">
                  <label htmlFor={field.name}>{field.label}:</label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    rows="2"
                  />
                </div>
              ))}
              <button type="submit" className="submit-button">Submit</button>
            </form>
          </div>
        )}

        {rockData && (
          <div className="results-section">
            <h2>Rock Analysis Results</h2>
            <div className="rock-properties">
              {Object.entries(rockData).map(([key, value]) => (
                <div key={key} className="property">
                  <h3>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
