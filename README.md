# SCORM Scenario Builder

A web application for creating SCORM-compliant training modules from customer service scenarios. Built with Next.js and Material-UI, following Pearson's branding guidelines.

## Features

- Create interactive training scenarios from:
  - Directly pasted scenarios
  - Excel/CSV files
  - PDF documents
  - Knowledge base article URLs
- Generates SCORM-compliant packages
- Modern, accessible UI following Pearson's design guidelines
- Real-time validation and feedback
- Support for multiple scenarios in a single package

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd scorm-scenario-builder
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. Choose your input method:
   - **Paste Scenarios**: Directly paste formatted scenarios
   - **Upload File**: Upload Excel, CSV, or PDF files
   - **Enter URL**: Provide a knowledge base article URL

2. For pasted scenarios, use the following format:
```
Question or Scenario Description

Answer or Expected Response

---

Next Question or Scenario Description

Next Answer or Expected Response
```

3. Click "Generate SCORM Package" to create your training module

4. The generated SCORM package will automatically download

## Development

- Built with Next.js 14
- Uses Material-UI for components
- TypeScript for type safety
- SCORM 1.2 compliant package generation

## License

This project is proprietary and confidential. © Pearson Education Ltd.

## Support

For support, please contact [your-contact-information]. 