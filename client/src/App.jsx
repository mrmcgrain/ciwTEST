import React, { useState } from 'react';
import Quiz from './Quiz';
import './App.css';

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('Both first and last name are required.');
      return;
    }

    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return <Quiz username={`${firstName} ${lastName}`} />;
  }

  return (
    <main className="app-shell">
      <section className="entry-layout">
        <div className="hero-panel">
          <h1>Candidate Assessment Platform</h1>
          <p className="hero-copy">
            A focused certification-style testing suite with randomized questions,
            timing, completion reporting, and attention monitoring.
          </p>
          <div className="metric-row" aria-label="Platform highlights">
            <div>
              <strong>9</strong>
              <span>Pathways</span>
            </div>
            <div>
              <strong>100+</strong>
              <span>Questions</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Tracking</span>
            </div>
          </div>
        </div>

        <form className="entry-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <span className="status-dot" />
            <div>
              <h2>Candidate Check-In</h2>
              <p>Enter your name to begin a test session.</p>
            </div>
          </div>

          <label className="field" htmlFor="firstName">
            <span>First Name</span>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
          />
          </label>

          <label className="field" htmlFor="lastName">
            <span>Last Name</span>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
          />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="primary-button" type="submit">Start Quiz</button>

          <div className="notice-list">
            <p>Roughly 100 questions per pathway</p>
            <p>Do not refresh or navigate back during a session</p>
            <p>Tab and window changes are monitored</p>
            <p>Results are emailed upon completion</p>
          </div>
        </form>
      </section>
    </main>
  );

}

export default App;
