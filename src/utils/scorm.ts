interface ScenarioData {
  question?: string;
  answer?: string;
  category?: string;
  content?: string;
  type?: string;
}

export async function createScormPackage(data: ScenarioData[]) {
  const files: Record<string, string> = {};
  
  // Generate imsmanifest.xml
  files['imsmanifest.xml'] = generateManifest();
  
  // Generate main HTML content
  files['index.html'] = generateMainHTML(data);
  
  // Generate JavaScript for SCORM communication
  files['scorm.js'] = generateScormJS();
  
  // Generate CSS styles
  files['styles.css'] = generateStyles();

  return files;
}

function generateManifest() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.pearson.scenario" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>Customer Service Training Scenario</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>Customer Service Training Scenario</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm.js"/>
      <file href="styles.css"/>
    </resource>
  </resources>
</manifest>`;
}

function generateMainHTML(data: ScenarioData[]) {
  const scenarios = data.map((item, index) => {
    if (item.question && item.answer) {
      return `
        <div class="scenario" data-index="${index}" style="display: none;">
          <div class="scenario-content">
            <h2>Scenario ${index + 1}</h2>
            <div class="question-section">
              <h3>Customer Query:</h3>
              <p>${item.question}</p>
            </div>
            <div class="response-section" style="display: none;">
              <textarea class="response-input" placeholder="Enter your response..."></textarea>
              <button class="submit-btn" onclick="submitResponse(${index})">Submit Response</button>
            </div>
            <div class="feedback-section" style="display: none;">
              <h3>Model Response:</h3>
              <p>${item.answer}</p>
              <div class="self-assessment">
                <h4>Self-Assessment:</h4>
                <div class="rating-buttons">
                  <button onclick="rateResponse(${index}, 1)">Needs Improvement</button>
                  <button onclick="rateResponse(${index}, 2)">Good</button>
                  <button onclick="rateResponse(${index}, 3)">Excellent</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (item.content) {
      return `
        <div class="scenario" data-index="${index}" style="display: none;">
          <div class="scenario-content">
            <h2>Knowledge Base Content</h2>
            <div class="content-section">
              <p>${item.content}</p>
            </div>
            <div class="comprehension-check">
              <h3>Comprehension Check:</h3>
              <textarea class="comprehension-input" placeholder="Summarize the key points..."></textarea>
              <button class="submit-btn" onclick="submitComprehension(${index})">Submit</button>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Service Training Scenario</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <img src="https://www.pearson.com/content/dam/one-dot-com/one-dot-com/global/Images/logos/Pearson_Logo_Primary_Blk_RGB.svg" alt="Pearson Logo" class="logo">
      <h1>Customer Service Training</h1>
    </header>
    
    <main>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      
      ${scenarios}
      
      <div class="navigation-buttons">
        <button id="prev-btn" onclick="previousScenario()" disabled>Previous</button>
        <button id="next-btn" onclick="nextScenario()">Next</button>
      </div>
    </main>
  </div>
</body>
</html>`;
}

function generateScormJS() {
  return `let currentScenario = 0;
let totalScenarios = 0;
let responses = [];
let scorm = pipwerks.SCORM;

// Initialize SCORM
function initializeScorm() {
  scorm.init();
  totalScenarios = document.querySelectorAll('.scenario').length;
  showScenario(0);
  updateProgress();
}

// Show specific scenario
function showScenario(index) {
  document.querySelectorAll('.scenario').forEach(scenario => {
    scenario.style.display = 'none';
  });
  
  const scenario = document.querySelector(\`.scenario[data-index="\${index}"]\`);
  if (scenario) {
    scenario.style.display = 'block';
  }
  
  document.getElementById('prev-btn').disabled = index === 0;
  document.getElementById('next-btn').disabled = index === totalScenarios - 1;
  
  updateProgress();
}

// Navigation functions
function previousScenario() {
  if (currentScenario > 0) {
    currentScenario--;
    showScenario(currentScenario);
  }
}

function nextScenario() {
  if (currentScenario < totalScenarios - 1) {
    currentScenario++;
    showScenario(currentScenario);
  }
}

// Submit response
function submitResponse(index) {
  const scenario = document.querySelector(\`.scenario[data-index="\${index}"]\`);
  const response = scenario.querySelector('.response-input').value;
  
  responses[index] = response;
  
  // Show feedback section
  scenario.querySelector('.feedback-section').style.display = 'block';
  
  // Save progress to SCORM
  saveProgress();
}

// Rate response
function rateResponse(index, rating) {
  responses[index] = {
    ...responses[index],
    rating: rating
  };
  
  // Save progress to SCORM
  saveProgress();
  
  // Enable next button
  document.getElementById('next-btn').disabled = false;
}

// Submit comprehension
function submitComprehension(index) {
  const scenario = document.querySelector(\`.scenario[data-index="\${index}"]\`);
  const comprehension = scenario.querySelector('.comprehension-input').value;
  
  responses[index] = comprehension;
  
  // Save progress to SCORM
  saveProgress();
  
  // Enable next button
  document.getElementById('next-btn').disabled = false;
}

// Update progress bar
function updateProgress() {
  const progress = ((currentScenario + 1) / totalScenarios) * 100;
  document.querySelector('.progress-fill').style.width = \`\${progress}%\`;
}

// Save progress to SCORM
function saveProgress() {
  const progress = {
    currentScenario,
    responses
  };
  
  scorm.set('cmi.core.lesson_location', JSON.stringify(progress));
  scorm.set('cmi.core.lesson_status', 'incomplete');
  scorm.save();
}

// Load progress from SCORM
function loadProgress() {
  const savedProgress = scorm.get('cmi.core.lesson_location');
  if (savedProgress) {
    const progress = JSON.parse(savedProgress);
    currentScenario = progress.currentScenario;
    responses = progress.responses;
    showScenario(currentScenario);
  }
}

// Initialize when page loads
window.onload = function() {
  initializeScorm();
  loadProgress();
};

// Save progress when page unloads
window.onunload = function() {
  scorm.set('cmi.core.exit', '');
  scorm.quit();
};`;
}

function generateStyles() {
  return `
/* Pearson brand styles */
:root {
  --pearson-purple: #005C9E;
  --pearson-light-purple: #8A7AB5;
  --pearson-amethyst: #4A3C8C;
  --pearson-white: #FFFFFF;
  --pearson-gray: #666666;
  --pearson-light-gray: #F8F9FA;
}

/* Typography */
body {
  font-family: "Plus Jakarta Sans", Arial, sans-serif;
  line-height: 1.5;
  color: #000000;
  margin: 0;
  padding: 0;
  background-color: var(--pearson-light-gray);
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  max-width: 200px;
  margin-bottom: 1rem;
}

h1 {
  font-size: 2.5rem;
  color: var(--pearson-purple);
  margin-bottom: 1rem;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--pearson-light-gray);
  border-radius: 4px;
  margin-bottom: 2rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--pearson-purple);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Scenario */
.scenario {
  background-color: var(--pearson-white);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scenario-content {
  max-width: 800px;
  margin: 0 auto;
}

/* Question Section */
.question-section {
  margin-bottom: 2rem;
}

/* Response Section */
.response-section {
  margin-bottom: 2rem;
}

.response-input,
.comprehension-input {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  border: 2px solid var(--pearson-light-purple);
  border-radius: 4px;
  margin-bottom: 1rem;
  font-family: inherit;
  resize: vertical;
}

/* Feedback Section */
.feedback-section {
  background-color: var(--pearson-light-gray);
  padding: 1.5rem;
  border-radius: 4px;
  margin-top: 2rem;
}

/* Buttons */
button {
  background-color: var(--pearson-purple);
  color: var(--pearson-white);
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: var(--pearson-amethyst);
}

button:disabled {
  background-color: var(--pearson-gray);
  cursor: not-allowed;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

/* Rating Buttons */
.rating-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .scenario {
    padding: 1.5rem;
  }
  
  .rating-buttons {
    flex-direction: column;
  }
  
  .rating-buttons button {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}`;
} 