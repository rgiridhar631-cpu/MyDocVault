# MYDOCVAULT

An offline-first AI DigiLocker for securely storing government documents, extracting structured data locally, and helping users understand which documents they need to submit for a specific office, service, or officer.

## Problem Statement

People often have government documents scattered across phones, folders, and email attachments. When they need to submit documents for an office or service, they usually do not know exactly which files are required. GovVault AI solves this by giving users a safe digital locker with an integrated local AI assistant.

## Solution

GovVault AI lets users upload and store documents such as Aadhaar, PAN, certificates, address proof, and forms. The app processes documents locally, extracts useful fields, stores them securely in SQLite, and provides a chatbot that explains the documents and suggests what may be needed for a particular request.

## Key Features

- Secure document upload and storage.
- Offline OCR and text extraction.
- Local structured data generation from unstructured documents.
- AI chatbot for document explanation and guidance.
- Search and retrieval of stored documents.
- Offline-first and CPU-friendly design.

## How It Works

1. The user uploads a document.
2. The app processes it locally using OCR or document parsing.
3. Important details are converted into structured JSON fields.
4. The data is stored in SQLite.
5. The chatbot answers questions based only on the uploaded documents and local rules.

## Tech Stack

- **Frontend:** React / Next.js
- **Backend:** FastAPI / Node.js
- **OCR:** Tesseract / local OCR engine
- **LLM:** llama.cpp / quantized small language model
- **Storage:** SQLite
- **Deployment:** Local-first web app

## Why This Fits the Hackathon

- Works without internet.
- Runs AI inference locally on CPU.
- Converts unstructured documents into structured data.
- Demonstrates secure and private document handling.
- Solves a practical real-world problem.

## Example Use Cases

- “What document is this?”
- “What should I submit for this office?”
- “Explain this certificate in simple words.”
- “Show all my identity proofs.”
- “Which documents are missing for this application?”

## Data Schema

Each document can be stored with fields like:

- document_id
- document_type
- holder_name
- document_number
- issue_date
- expiry_date
- issuing_authority
- extracted_text
- file_path
- tags

## Offline and Privacy Design

GovVault AI does not depend on external APIs. All processing, inference, and storage happen locally to protect privacy and to keep the app usable even in air-gapped environments.

## Installation and Setup

### Prerequisites

- Node.js >= 18.0.0
- npm

### Local Run Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   ```bash
   npm run setup
   ```
4. Start the application:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`.

### PWA Support (Offline Mode)

The application includes full Progressive Web App (PWA) support. Once loaded in your browser, it installs a service worker that caches all assets. This allows the core UI and features to be fully accessible offline, adhering to the air-gapped/privacy design principles.

## Deployment Guide

### One-Click Deploy to Render

You can deploy this web application with a persistent SQLite database using the included `render.yaml` configuration:

1. Push this repository to your GitHub account.
2. Sign in to [Render](https://render.com).
3. Click **New** -> **Blueprint Route** and connect your repository.
4. Render will automatically configure the Web Service and mount a persistent disk at `/data/vault.db` for the database.

### Configure GitLab Environment

To link your live deployment URL to your GitLab project:

1. In GitLab, go to **Settings** -> **CI/CD** -> **Variables**.
2. Add a variable named `DEPLOYMENT_URL` with the value of your live application URL.
3. The GitLab CI/CD pipeline will automatically detect this and register the production environment under **Operate** -> **Environments**.

## Team

- Member 1: UI, chatbot logic, README, demo
- Member 2: OCR pipeline, storage, schema, document processing

## Future Scope

- Smart reminders for document expiry.
- Rule-based document checklist for different services.
- Multi-language OCR support.
- Duplicate document detection.
- Encrypted backup/export.

## License

For hackathon use only.
