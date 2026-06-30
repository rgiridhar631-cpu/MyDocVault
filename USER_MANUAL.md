# MyDocVault User Manual

Welcome to MyDocVault! This guide will help you understand how to navigate and use MyDocVault to organize your documents offline.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Uploading Documents](#uploading-documents)
4. [Document Vault](#document-vault)
5. [Asking AI (Chatbot)](#asking-ai-chatbot)
6. [Checking Government Services](#checking-government-services)

---

## 1. Overview

MyDocVault is a privacy-first, local-only digital locker. It allows you to store your certificates, ID cards, and bills, parse their details locally using OCR, and interact with a chatbot powered by local AI to answer queries and check requirements for government services.

## 2. Getting Started

To run MyDocVault locally:

1. Start the server using: `npm start`
2. Open your browser and navigate to `http://localhost:3000`.
3. Verify the model badge in the top right shows "Ollama" or your active AI backend.

## 3. Uploading Documents

1. Navigate to the **Upload Docs** tab in the sidebar.
2. Drag and drop your files into the zone, or click **browse** to select them. Supported formats: PDF, PNG, JPG (Max 20MB).
3. The system will start OCR processing. You will see progress updates in the queue list.

## 4. Document Vault

1. Click on **Document Vault** to view all saved document metadata.
2. Search by document holder's name or document type using the search bar.
3. Click on any document card to view the extracted fields and summary.
4. Delete documents by clicking the **Delete** button.

## 5. Asking AI (Chatbot)

1. Go to the **Ask AI** tab.
2. Ask questions about your documents (e.g., _"What is the expiry date of my driving license?"_).
3. The AI only uses files inside your vault to construct answers.

## 6. Checking Government Services

1. Go to the **Gov Services** tab.
2. Select a service card (e.g., Passport, Bank KYC).
3. Click **Check Docs**. The system will scan your vault and list satisfied requirements and missing documents.
