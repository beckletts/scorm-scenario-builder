# HTMLwiz Transcript Schema for AI Tools

## Overview
This schema helps AI tools generate properly formatted transcripts for HTMLwiz's audio splitting functionality. HTMLwiz can automatically split audio files based on transcript structure and create individual slide audio clips.

## Supported Formats (in order of preference)

### 1. Timestamp-Based Format (RECOMMENDED)
Use timestamp markers in square brackets to indicate when each section begins.

```
[00:00] TITLE: Introduction
Welcome to our presentation. This section covers the basic overview and objectives.

[02:30] TITLE: Main Topic
Here we dive into the core subject matter with detailed explanations and examples.

[05:45] TITLE: Advanced Concepts
This section explores more complex ideas and their practical applications.

[08:15] TITLE: Conclusion
We wrap up with key takeaways and next steps for the audience.
```

**Timestamp Format Rules:**
- Use format: `[MM:SS]` or `[HH:MM:SS]`
- Place at the beginning of each new section
- Examples: `[00:00]`, `[02:30]`, `[1:05:45]`

### 2. Triple Dash Format
Use three dashes to separate sections when timestamps aren't available.

```
TITLE: Introduction
Welcome to our presentation. This section covers the basic overview.
---
TITLE: Main Topic
Here we dive into the core subject matter with detailed explanations.
---
TITLE: Advanced Concepts
This section explores more complex ideas and applications.
---
TITLE: Conclusion
We wrap up with key takeaways and next steps.
```

### 3. Slide Marker Format
Use numbered slide markers for structured content.

```
[Slide 1] TITLE: Introduction
Welcome to our presentation overview.

[Slide 2] TITLE: Main Topic
Core subject matter and explanations.

[Slide 3] TITLE: Advanced Concepts
Complex ideas and applications.

[Slide 4] TITLE: Conclusion
Key takeaways and next steps.
```

## Title Recognition Patterns

HTMLwiz automatically extracts titles using these patterns (in order of preference):

1. `TITLE: Your Title Here`
2. `Title: Your Title Here`
3. `[Your Title Here]`
4. `# Your Title Here`
5. `1. Your Title Here`
6. `- Your Title Here`
7. `> Your Title Here`
8. `SLIDE: Your Title Here`
9. `PART 1: Your Title Here`
10. `SECTION: Your Title Here`
11. `TOPIC: Your Title Here`
12. `MODULE: Your Title Here`

## Complete Example Template

```
Document Management Training - Timestamped Transcript

[00:00] TITLE: Welcome & Course Overview
Welcome to the Document Management e-training course. This course is designed to help staff understand the importance of good document management and stay compliant with policies. The course will take approximately 25 minutes to complete.

[02:00] TITLE: Introduction to Document Management
Good document management is crucial for ensuring that an organisation's information is secure, organised, accessible, and compliant with legal and regulatory requirements throughout its lifecycle.

[03:30] TITLE: Benefits of Good Document Management
Interactive overview of the benefits including enhanced security, regulatory compliance, improved efficiency, risk reduction, business continuity support, and governance accountability.

[05:00] TITLE: Document Classification Levels
Data classification process categorizing information according to protection requirements:
- DCL1 - Public: No material harm if released
- DCL2 - Internal: Should not be shared externally
- DCL3 - Confidential: Approved individuals only
- DCL4 - Restricted: Most sensitive business data

[08:15] TITLE: Document Control Responsibilities
Each department is responsible for document control, ensuring key documents are fit for purpose, regularly reviewed, and readily available. Required elements include title, version number, author, owner, dates, and classification levels.

[12:00] TITLE: Version Control and Changes
Version numbering system using whole and decimal numbers. Draft documents start as 0.1, approved documents become 1.0, minor changes increment decimals, major revisions increment whole numbers.

[15:30] TITLE: Document Retention Policy
Essential for legal compliance and efficient information management. Ensures documents are retained for necessary periods and disposed of appropriately, reducing risk of data breaches and legal penalties.

[20:00] TITLE: Microsoft 365 File Sharing
Preferred method for file sharing using SharePoint and OneDrive. Includes retention labels, access controls, and secure sharing protocols for both internal and external collaboration.

[24:30] TITLE: Course Conclusion
Thank you for completing the document management training. Remember that effective document management is crucial for compliance, security, and efficiency. Please adhere to policy guidelines in your daily work.
```

## AI Tool Prompt Template

Use this prompt template with AI tools like Copilot:

```
Please convert this content into a properly formatted transcript for HTMLwiz using the following schema:

1. Add timestamp markers in [MM:SS] format at logical break points
2. Use "TITLE: [Title Text]" at the beginning of each major section
3. Ensure each section has substantial content (aim for 1-3 minutes of speech per section)
4. Break content into 5-15 logical sections for optimal audio splitting
5. Include clear, descriptive titles that summarize each section's content
6. Maintain the original content structure while adding timing information

Format example:
[00:00] TITLE: Section Name
Content for this section goes here...

[03:45] TITLE: Next Section Name  
Content for the next section goes here...

Original content to format:
[INSERT YOUR CONTENT HERE]
```

## Best Practices for AI-Generated Transcripts

### Content Structure
- **Section Length**: Aim for 1-5 minutes per section (roughly 150-750 words)
- **Total Sections**: Optimal range is 5-15 sections for most presentations
- **Title Clarity**: Use descriptive titles that clearly indicate section content

### Timing Guidelines
- Start with `[00:00]` for the first section
- Space sections 2-5 minutes apart typically
- Consider natural speaking pace and content complexity
- Account for pauses, emphasis, and interaction time

### Content Quality
- Maintain logical flow between sections
- Include key points, examples, and transitions
- Preserve important details while ensuring readability
- Add context for interactive elements or visual content

## HTMLwiz Processing Features

When you upload this formatted transcript to HTMLwiz:

1. **Automatic Detection**: Recognizes timestamp format and splits accordingly
2. **Debug Mode**: Shows detected sections for verification before processing
3. **Title Extraction**: Automatically pulls titles using recognition patterns
4. **Audio Splitting**: Creates individual audio files proportional to content length
5. **Slide Generation**: Builds interactive slides with synchronized audio

## Alternative Methods Available

If automatic splitting doesn't work perfectly, HTMLwiz also offers:

- **Manual Timestamps**: Specify exact cut points (e.g., "1:30, 3:45, 5:20")
- **Individual Audio Mode**: Upload separate audio files for each slide
- **Bulk Individual Upload**: Select multiple audio files to assign to slides in order

## Error Prevention

Common issues to avoid:
- Missing or inconsistent timestamp formatting
- Extremely short sections (less than 30 seconds)
- Too many sections (over 20) creating very short audio clips
- Inconsistent title formatting within the same transcript
- Missing content between timestamp markers 