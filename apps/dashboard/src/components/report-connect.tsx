import React, { useState, useRef } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, FileCode2, FileUp, Sparkles, Terminal, UploadCloud } from "lucide-react";
import { LoomLogo } from "./brand/loom-brand.js";
import { Button } from "./ui.js";

interface ReportConnectScreenProps {
  onFileLoaded: (content: string, filename: string) => void;
  onUrlSubmit: (url: string) => void;
  onDemoClick: () => void;
  error?: string;
  loading?: boolean;
}

export function ReportConnectScreen({
  onFileLoaded,
  onUrlSubmit,
  onDemoClick,
  error,
  loading = false,
}: ReportConnectScreenProps) {
  const [urlInput, setUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") onFileLoaded(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") onFileLoaded(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) onUrlSubmit(urlInput.trim());
  };

  return (
    <div className="report-connect-page">
      <div className="report-connect-card">
        <div className="connect-brand-header">
          <LoomLogo height={34} />
          <span className="connect-version-badge">v0.1.0</span>
        </div>

        <h1 className="connect-title">Change-Impact Intelligence Cockpit</h1>
        <p className="connect-subtitle">
          Connect an authentic Loom report produced by the CLI to review contract changes,
          affected consumer modules, and evidence paths.
        </p>

        {error && (
          <div className="connect-error-banner" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Failed to load report</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="connect-grid">
          {/* Option A: Drop / Select File */}
          <div
            className={`connect-dropzone ${dragActive ? "dropzone-active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            aria-label="Upload Loom report JSON file"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              style={{ display: "none" }}
              aria-hidden="true"
            />
            <div className="dropzone-icon">
              <UploadCloud size={28} aria-hidden="true" />
            </div>
            <h3>Open Report JSON File</h3>
            <p>Drag and drop a <code>.loom/reports/report.json</code> file here, or click to browse.</p>
            <Button variant="secondary" size="sm" type="button">
              <FileUp size={14} aria-hidden="true" /> Select from disk
            </Button>
          </div>

          {/* Option B: Load via URL */}
          <div className="connect-url-pane">
            <h3>Load from dev server or remote URL</h3>
            <p>Fetch from the local Vite dev server endpoint or an HTTP report URL:</p>
            <form onSubmit={handleSubmitUrl} className="connect-url-form">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="/reports/report.json or http://localhost:4175/report.json"
                aria-label="Report URL"
                disabled={loading}
              />
              <Button variant="primary" size="md" type="submit" disabled={!urlInput.trim() || loading}>
                {loading ? "Loading…" : "Load"}
                <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </form>
            <p className="url-sandbox-note">
              Browsers cannot read raw filesystem paths directly. Drag and drop into the zone on the left, or access <code>/reports/report.json</code> served by Vite.
            </p>
          </div>
        </div>

        {/* Option C: Terminal Instructions */}
        <div className="connect-cli-box">
          <div className="cli-box-header">
            <Terminal size={14} aria-hidden="true" />
            <span>Generate a report in your project</span>
          </div>
          <pre className="connect-cli-command">
            <code>node dist/cli.js report --format json --output .loom/reports/report.json</code>
          </pre>
          <p className="cli-hint">
            The CLI analyzes Git working tree changes, resolves contracts with TypeScript, and emits versioned JSON.
          </p>
        </div>

        {/* Option D: Explicit Demo Mode */}
        <div className="connect-demo-footer">
          <div className="demo-explainer">
            <Sparkles size={16} aria-hidden="true" />
            <span>Want to explore the interface without a repository?</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onDemoClick} type="button">
            Launch demo fixture (synthetic)
          </Button>
        </div>
      </div>
    </div>
  );
}
