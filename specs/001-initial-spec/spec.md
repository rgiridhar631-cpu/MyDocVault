# Feature Specification: MyDocVault Core Ingestion

## 1. Description

Core features to upload documents (PDF/images), parse local text using Tesseract OCR/pdf-parse, extract metadata using local LLMs (Ollama), and persist metadata inside local SQLite.

## 2. Requirements

- Upload PDF, PNG, JPEG formats.
- Complete offline local processing.
- Structured SQLite database storage.
- Interactive Q&A chat based on vault data.
