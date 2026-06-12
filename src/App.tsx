const workflowSteps = [
  { label: "Camera", state: "next" },
  { label: "Voice", state: "queued" },
  { label: "Vision", state: "queued" },
  { label: "Reply", state: "queued" },
];

function App() {
  return (
    <main className="app-shell">
      <section className="session-stage" aria-label="AI 视觉对话助手">
        <div className="preview-surface">
          <div className="camera-frame">
            <div className="focus-ring" />
            <div className="scan-line" />
          </div>
          <div className="status-panel" aria-live="polite">
            <span className="status-dot" />
            <span>Waiting for camera access</span>
          </div>
        </div>

        <div className="control-dock">
          <div className="brand-block">
            <p className="eyebrow">Visual Dialogue Assistant</p>
            <h1>AI 视觉对话助手</h1>
          </div>

          <div className="step-row" aria-label="对话流程">
            {workflowSteps.map((step) => (
              <div className={`step-pill step-${step.state}`} key={step.label}>
                {step.label}
              </div>
            ))}
          </div>

          <button className="primary-action" type="button">
            Start session
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;

