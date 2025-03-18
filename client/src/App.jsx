import React, { useState } from 'react';
import Quiz from './Quiz';

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Define buttonStyle inside the component function
  const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    marginLeft: '10px'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that both fields are filled
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
    <div className="app-container" 
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width:  '100vw',
  
    }}
    >

      <h1>Testing Station </h1>
      <form onSubmit={handleSubmit} style={{
        width: '300px',
        maxWidth: '400px'
      }}>
        <div style={{ margin: '15px 0' }}>
          <label htmlFor="firstName" style={{ display: 'block', marginBottom: '5px' }}>First Name:</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ margin: '15px 0' }}>
          <label htmlFor="lastName" style={{ display: 'block', marginBottom: '5px' }}>Last Name:</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        {error && <p className="error" style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={buttonStyle}>Start Quiz</button>
      </form>

      <br />

      <p>There are roughly 100 questions per pathway</p>
      <p>Do not refresh your screen or go back</p>
      <p>Viewing other tabs or browsers are monitored</p>
      <p>Results will be emailed upon completion</p>
    </div>
  );

}

export default App;
