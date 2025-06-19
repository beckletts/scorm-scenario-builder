interface ScenarioData {
  question?: string;
  answer?: string;
  category?: string;
  content?: string;
  type?: string;
}

export async function createScormPackage(data: ScenarioData[], settings?: any) {
  const files: Record<string, string> = {};
  
  // Generate imsmanifest.xml
  files['imsmanifest.xml'] = generateManifest(settings);
  
  // Generate main HTML content
  files['index.html'] = generateMainHTML(data, settings);
  
  // Generate JavaScript for SCORM communication
  files['scorm.js'] = generateScormJS(settings);
  
  // Generate CSS styles
  files['styles.css'] = generateStyles();

  return files;
}

function generateManifest(settings?: any) {
  const scormVersion = settings?.scormVersion || '2004';
  const courseTitle = settings?.courseTitle || 'Customer Service Training Scenario';
  let schemaVersion = '2004 3rd Edition';
  let manifestAttrs = `identifier="com.pearson.scenario" version="1.3"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                      http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                      http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                      http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                      http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd"`;
  if (scormVersion === '1.2') {
    schemaVersion = '1.2';
    manifestAttrs = `identifier="com.pearson.scenario" version="1.0"
    xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                        http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                        http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd"`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest ${manifestAttrs}>
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>${schemaVersion}</schemaversion>
  </metadata>
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>${courseTitle}</title>
      <item identifier="item_1" identifierref="resource_1" isvisible="true">
        <title>${courseTitle}</title>
        <imsss:sequencing>
          <imsss:deliveryControls tracked="true" completionSetByContent="true" objectiveSetByContent="true"/>
        </imsss:sequencing>
      </item>
      <imsss:sequencing>
        <imsss:controlMode choice="true" flow="true"/>
        <imsss:rollupRules>
          <imsss:rollupRule childActivitySet="all">
            <imsss:rollupConditions>
              <imsss:rollupCondition condition="satisfied"/>
            </imsss:rollupConditions>
            <imsss:rollupAction action="satisfied"/>
          </imsss:rollupRule>
          <imsss:rollupRule childActivitySet="all">
            <imsss:rollupConditions>
              <imsss:rollupCondition operator="not" condition="satisfied"/>
            </imsss:rollupConditions>
            <imsss:rollupAction action="notSatisfied"/>
          </imsss:rollupRule>
          <imsss:rollupRule childActivitySet="all">
            <imsss:rollupConditions>
              <imsss:rollupCondition condition="completed"/>
            </imsss:rollupConditions>
            <imsss:rollupAction action="completed"/>
          </imsss:rollupRule>
          <imsss:rollupRule childActivitySet="all">
            <imsss:rollupConditions>
              <imsss:rollupCondition operator="not" condition="completed"/>
            </imsss:rollupConditions>
            <imsss:rollupAction action="incomplete"/>
          </imsss:rollupRule>
        </imsss:rollupRules>
      </imsss:sequencing>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm.js"/>
      <file href="styles.css"/>
    </resource>
  </resources>
</manifest>`;
}

function generateMainHTML(data: ScenarioData[], settings?: any) {
  const courseTitle = settings?.courseTitle || 'Customer Service Training Scenario';
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
  <title>${courseTitle}</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <img src="https://www.pearson.com/content/dam/one-dot-com/one-dot-com/global/Images/logos/Pearson_Logo_Primary_Blk_RGB.svg" alt="Pearson Logo" class="logo">
      <h1>${courseTitle}</h1>
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

function generateScormJS(settings?: any) {
  const completionCriteria = settings?.completionCriteria || 'last';
  return `// Minimal SCORM 2004 API wrapper
var scormAPI = null;
var initialized = false;
var terminated = false;
var currentScenario = 0;
var totalScenarios = 0;
var responses = [];

function findAPI(win) {
  var tries = 0;
  while (win && tries < 10) {
    if (win.API_1484_11) return win.API_1484_11;
    win = win.parent;
    tries++;
  }
  return null;
}

function scormInit() {
  scormAPI = findAPI(window) || findAPI(window.top);
  if (scormAPI && scormAPI.Initialize("") === "true") {
    initialized = true;
    // Set to incomplete at start
    scormAPI.SetValue("cmi.completion_status", "incomplete");
    scormAPI.Commit("");
  }
}

function scormSetBookmark(data) {
  if (initialized && scormAPI) {
    scormAPI.SetValue("cmi.location", JSON.stringify(data));
    scormAPI.Commit("");
  }
}

function scormGetBookmark() {
  if (initialized && scormAPI) {
    var loc = scormAPI.GetValue("cmi.location");
    try {
      return loc ? JSON.parse(loc) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function scormComplete() {
  if (initialized && scormAPI) {
    scormAPI.SetValue("cmi.completion_status", "completed");
    scormAPI.Commit("");
  }
}

function scormTerminate() {
  if (initialized && scormAPI && !terminated) {
    scormAPI.Terminate("");
    terminated = true;
  }
}

// UI logic
function showScenario(index) {
  document.querySelectorAll('.scenario').forEach(scenario => {
    scenario.style.display = 'none';
  });
  var scenario = document.querySelector('.scenario[data-index="' + index + '"]');
  if (scenario) {
    scenario.style.display = 'block';
  }
  document.getElementById('prev-btn').disabled = index === 0;
  document.getElementById('next-btn').disabled = index === totalScenarios - 1;
  updateProgress();
}

function previousScenario() {
  if (currentScenario > 0) {
    currentScenario--;
    showScenario(currentScenario);
    saveProgress();
  }
}

function nextScenario() {
  if (currentScenario < totalScenarios - 1) {
    currentScenario++;
    showScenario(currentScenario);
    saveProgress();
  }
}

function submitResponse(index) {
  var scenario = document.querySelector('.scenario[data-index="' + index + '"]');
  var response = scenario.querySelector('.response-input').value;
  responses[index] = response;
  scenario.querySelector('.feedback-section').style.display = 'block';
  saveProgress();
}

function rateResponse(index, rating) {
  responses[index] = {
    ...responses[index],
    rating: rating
  };
  saveProgress();
  document.getElementById('next-btn').disabled = false;
}

function submitComprehension(index) {
  var scenario = document.querySelector('.scenario[data-index="' + index + '"]');
  var comprehension = scenario.querySelector('.comprehension-input').value;
  responses[index] = comprehension;
  saveProgress();
  document.getElementById('next-btn').disabled = false;
}

function updateProgress() {
  var progress = ((currentScenario + 1) / totalScenarios) * 100;
  document.querySelector('.progress-fill').style.width = progress + '%';
}

function saveProgress() {
  var progress = {
    currentScenario: currentScenario,
    responses: responses
  };
  scormSetBookmark(progress);
  if (completionCriteria === 'last') {
    if (currentScenario === totalScenarios - 1) {
      scormComplete();
    }
  }
}

function loadProgress() {
  var progress = scormGetBookmark();
  if (progress) {
    currentScenario = progress.currentScenario;
    responses = progress.responses;
    showScenario(currentScenario);
  }
}

window.onload = function() {
  scormInit();
  totalScenarios = document.querySelectorAll('.scenario').length;
  showScenario(0);
  updateProgress();
  loadProgress();
};

window.onunload = function() {
  scormTerminate();
};
`;
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