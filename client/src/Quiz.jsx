import React, { useCallback, useEffect, useRef, useState } from 'react';

const testOptions = [
    { file: 'css.json', label: 'CSS', detail: 'Selectors, layout, styling fundamentals' },
    { file: 'html.json', label: 'HTML', detail: 'Semantic structure and markup basics' },
    { file: 'javaScript.json', label: 'JavaScript', detail: 'Language features and browser logic' },
    { file: 'react.json', label: 'React', detail: 'Components, state, and rendering' },
    { file: 'backend.json', label: 'Backend', detail: 'Server-side concepts and APIs' },
    { file: 'secplus.json', label: 'Security+', detail: 'CompTIA security foundations' },
    { file: 'networkPlus.json', label: 'Network+', detail: 'Networking principles and operations' },
    { file: 'test.json', label: 'Practice Exam', detail: 'General validation test' },
    { file: 'ddd.json', label: 'DDD', detail: 'Domain-driven design concepts' },
];

const googleSheetsEndpoint =
    window.APP_CONFIG?.GOOGLE_SHEETS_WEB_APP_URL ||
    import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL ||
    '';

function Quiz({ username }) {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [testType, setTestType] = useState(null);
    const [totalTime, setTotalTime] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [tabSwitchEvents, setTabSwitchEvents] = useState([]);
    const [submissionStatus, setSubmissionStatus] = useState('idle');
    // const [focusEvents, setFocusEvents] = useState([]);
    const [shuffledOptions, setShuffledOptions] = useState([]);
    // const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [originalQuestions, setOriginalQuestions] = useState([])
    const [adminTestQuestion, setAdminTestQuestion] = useState(false)
    const resultsSubmittedRef = useRef(false);

    // Add state for away tracking
    const [isAway, setIsAway] = useState(false);
    const [awayStartTime, setAwayStartTime] = useState(null);
    const [totalAwayTime, setTotalAwayTime] = useState(0);
    const [exitPoints, setExitPoints] = useState([]);

    // Helper function to shuffle array
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    useEffect(() => {
        async function loadQuestions() {
            if (!testType) return;
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}${testType}`);
                const data = await response.json();

                // State to hold OG question array pre scramble for indice check for debuging
                setOriginalQuestions(data)

                const finalQuestions = shuffleArray([...data]); //shuffled Questions
                setQuestions(finalQuestions);


                // Start the timer when questions are loaded
                setTimerRunning(true);
                setTotalTime(0);
            } catch (error) {
                console.error("Error loading questions:", error);
            }
        }

        loadQuestions();
    }, [testType]);

    // Effect to shuffle options when currentQuestion changes
    useEffect(() => {

        // Questins are shuffled at this point, now for option tht dont match

        if (questions.length > 0 && questions[currentQuestion] && questions[currentQuestion].options) {
            const currentOptions = questions[currentQuestion].options;

            // console.log("curtent options", currentOptions)

            // Check if any option includes "Both" before shuffling
            const hasBothOption = currentOptions.some(option => option.includes("Both"));

            // Only shuffle if there's no "Both" option
            if (hasBothOption) {
                // console.log("not shug")
                setShuffledOptions([...currentOptions]);  // not shuffled
            } else {
                // console.log("Shufflingg")

                setShuffledOptions(shuffleArray([...currentOptions]));  //shuffled  OPTIONS
            }
        }

    }, [currentQuestion, questions]);

    // Timer effect that runs every second
    useEffect(() => {
        let interval;
        if (timerRunning) {
            interval = setInterval(() => {
                setTotalTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    // Enhanced window/tab tracking
    const lastClickRef = useRef({ x: 0, y: 0, time: 0 });
    useEffect(() => {
        if (!testType || quizFinished) return;

        // Track the last click position to detect tab clicks

        function handleFocusLoss(type, eventDetails = {}) {
            // Only record and increment counter if not already away
            if (!isAway) {
                const timestamp = new Date().toISOString();
                setTabSwitchCount(prev => prev + 1);
                setShowWarning(true);
                setIsAway(true);
                setAwayStartTime(Date.now());

                const eventData = {
                    timestamp,
                    questionNumber: currentQuestion + 1,
                    eventType: type,
                    ...eventDetails
                };

                setTabSwitchEvents(prev => [...prev, eventData]);
            }
        }

        function handleFocusReturn() {
            if (isAway && awayStartTime) {
                // Calculate time spent away
                const awayTime = Math.floor((Date.now() - awayStartTime) / 1000);
                setTotalAwayTime(prev => prev + awayTime);

                // Reset away status
                setIsAway(false);
                setAwayStartTime(null);

                // Only hide warning if it's still showing
                if (showWarning) {
                    setShowWarning(false);
                }
            }
        }

        // Handle visibility change (tab switching)
        function handleVisibilityChange() {
            if (document.visibilityState === 'hidden') {
                // Check if this was likely caused by a tab click
                const now = Date.now();
                const timeSinceLastClick = now - lastClickRef.current.time;

                // If click was very recent (less than 300ms ago) and near the top of the browser
                if (timeSinceLastClick < 300 && lastClickRef.current.y < 50) {
                    handleFocusLoss('browser_tab_click', {
                        clickPosition: { ...lastClickRef.current }
                    });
                } else {
                    handleFocusLoss('tab_switch');
                }
            } else {
                handleFocusReturn();
            }
        }

        // Handle window blur (clicking outside the browser)
        function handleWindowBlur() {
            handleFocusLoss('window_blur');
        }

        // Handle window focus return
        function handleWindowFocus() {
            handleFocusReturn();
        }

        // Enhanced mouse leave tracking with coordinates
        function handleMouseLeave(e) {
            const x = e.clientX;
            const y = e.clientY;

            // Record the exit point
            const exitPoint = {
                x,
                y,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight
            };

            setExitPoints(prev => [...prev, exitPoint]);

            // Determine exit location (top, bottom, left, right)
            let exitLocation = "";
            if (y <= 0) exitLocation = "top";
            else if (y >= window.innerHeight) exitLocation = "bottom";
            else if (x <= 0) exitLocation = "left";
            else if (x >= window.innerWidth) exitLocation = "right";

            // Only count if mouse actually leaves the window bounds
            if (exitLocation) {
                handleFocusLoss('mouse_leave', {
                    exitPoint: exitPoint,
                    exitLocation: exitLocation
                });
            }
        }

        // Track clicks to see last click position before leaving
        function handleClick(e) {
            const clickPoint = {
                x: e.clientX,
                y: e.clientY,
                timestamp: new Date().toISOString(),
                element: e.target.tagName,
                elementId: e.target.id || "unknown"
            };

            // Update last click reference
            lastClickRef.current = {
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            };

            // Store click events
            setExitPoints(prev => {
                const newPoints = [...prev, clickPoint];
                return newPoints.slice(-5);  // Keep last 5 clicks
            });

            // If click is very close to top of window, it might be the browser's tab bar
            if (e.clientY < 10 && e.clientY >= 0) {
                // Record this as a potential tab click event
                setTabSwitchEvents(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    questionNumber: currentQuestion + 1,
                    eventType: 'potential_tab_bar_click',
                    position: { x: e.clientX, y: e.clientY }
                }]);
            }
        }

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('click', handleClick);

        // Clean up
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('click', handleClick);
        };
    }, [testType, quizFinished, currentQuestion, isAway, awayStartTime, showWarning]);

    const handleAnswerSelect = (answer) => {
        // console.log("handleAnswe", answer)
        setSelectedAnswer(answer);
        // console.log("Correct Answer", questions[currentQuestion].correctAnswer)

    };

    const handleNextQuestion = () => {
        if (selectedAnswer === questions[currentQuestion].correctAnswer) {
            setScore(score + 1);
        } else {
            setWrongAnswers(prev => [
                ...prev,
                {
                    question: questions[currentQuestion].question,
                    userAnswer: selectedAnswer,
                    correctAnswer: questions[currentQuestion].correctAnswer
                }
            ]);
        }

        setSelectedAnswer(null);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setQuizFinished(true);
            setTimerRunning(false); // Stop the timer when quiz is finished
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };





    const submitResults = useCallback((name) => {

        const percentage = ((score / questions.length) * 100).toFixed(2);

        // Calculate final away time in case test ends while away
        let finalAwayTime = totalAwayTime;
        if (isAway && awayStartTime) {
            finalAwayTime += Math.floor((Date.now() - awayStartTime) / 1000);
        }

        const resultPayload = {
            timestamp: new Date().toISOString(),
            name,
            testType,
            score,
            totalQuestions: questions.length,
            percentage,
            totalTime: formatTime(totalTime),
            totalAwayTime: formatTime(finalAwayTime),
            tabSwitches: tabSwitchCount,
            wrongAnswers,
            tabSwitchDetails: tabSwitchEvents,
            exitPoints,
            userAgent: navigator.userAgent,
            pageUrl: window.location.href,
        };

        if (!googleSheetsEndpoint) {
            console.warn('Google Sheets endpoint is not configured.', resultPayload);
            setSubmissionStatus('not-configured');
            return;
        }

        setSubmissionStatus('submitting');
        fetch(googleSheetsEndpoint, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(resultPayload),
        })
            .then(() => {
                setSubmissionStatus('submitted');
                console.log('Results submitted to Google Sheets.');
            })
            .catch((error) => {
                setSubmissionStatus('failed');
                console.error('Failed to submit results to Google Sheets:', error);
            });
    }, [awayStartTime, exitPoints, isAway, questions.length, score, tabSwitchCount, tabSwitchEvents, testType, totalAwayTime, totalTime, wrongAnswers])

    useEffect(() => {
        if (quizFinished && questions.length > 0 && !resultsSubmittedRef.current) {
            resultsSubmittedRef.current = true;
            submitResults(username);
        }
    }, [quizFinished, questions.length, submitResults, username]);




    if (!testType) {
        return (
            <main className="app-shell">
                <section className="selection-shell">
                    <div className="section-heading">
                        <p className="eyebrow">Welcome, {username}</p>
                        <h1>Select Assessment</h1>
                        <p>Choose a pathway to start a timed, randomized testing session.</p>
                    </div>

                    <div className="test-grid">
                        {testOptions.map((test) => (
                            <button
                                className="test-card"
                                key={test.file}
                                onClick={() => setTestType(test.file)}
                                type="button"
                            >
                                <span>{test.label}</span>
                                <small>{test.detail}</small>
                            </button>
                        ))}
                    </div>

                    <div className="suite-footer">
                        <span>Randomized questions</span>
                        <span>Elapsed-time tracking</span>
                        <span>Sheet-ready reporting</span>
                    </div>
                </section>
            </main>
        );
    }

    if (questions.length === 0) {
        return (
            <main className="app-shell">
                <div className="loading-card">
                    <div className="loader" />
                    <p>Loading questions...</p>
                </div>
            </main>
        );
    }

    if (quizFinished) {
        const percentage = ((score / questions.length) * 100).toFixed(2);

        return (
            <main className="app-shell">
                <section className="results-shell">
                    <div className="section-heading">
                        <p className="eyebrow">Session Complete</p>
                        <h1>Quiz Finished</h1>
                        <p>
                            {submissionStatus === 'submitted' && 'Results were submitted to your assessment log.'}
                            {submissionStatus === 'submitting' && 'Submitting results to your assessment log...'}
                            {submissionStatus === 'not-configured' && 'Results are ready, but Google Sheets is not configured yet.'}
                            {submissionStatus === 'failed' && 'Results could not be submitted. Please review the browser console.'}
                            {submissionStatus === 'idle' && 'Results have been prepared for your assessment log.'}
                        </p>
                    </div>

                    <div className="results-summary">
                        <div>
                            <span>Score</span>
                            <strong>{score} / {questions.length}</strong>
                        </div>
                        <div>
                            <span>Accuracy</span>
                            <strong>{percentage}%</strong>
                        </div>
                        <div>
                            <span>Total Time</span>
                            <strong>{formatTime(totalTime)}</strong>
                        </div>
                    </div>

                    <div className="review-panel">
                        <h2>Incorrect Answers</h2>
                        {wrongAnswers.length === 0 ? (
                            <p className="empty-state">Perfect score. No incorrect answers to review.</p>
                        ) : (
                            <div className="wrong-answer-list">
                                {wrongAnswers.map((item, index) => (
                                    <article className="wrong-answer" key={`${item.question}-${index}`}>
                                        <h3>{item.question}</h3>
                                        <p><span>Your answer</span>{item.userAnswer || 'No answer selected'}</p>
                                        <p><span>Correct answer</span>{item.correctAnswer}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        className="primary-button compact"
                        onClick={() => window.location.reload()}
                        type="button"
                    >
                        Take Another Test
                    </button>
                </section>
            </main>
        );
    }

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <main className="app-shell">
            {showWarning && (
                <div className="warning-banner">
                    Warning: Tab switching detected. This will be recorded.
                </div>
            )}

            <section className="quiz-shell">
                <header className="quiz-header">
                    <div>
                        <p className="eyebrow">{testType.replace('.json', '')} assessment</p>
                        <h1>Question {currentQuestion + 1}</h1>
                    </div>
                    <div className="quiz-stats">
                        <span>{formatTime(totalTime)}</span>
                        <span>{currentQuestion + 1} / {questions.length}</span>
                    </div>
                </header>

                <div className="progress-track" aria-label="Quiz progress">
                    <span style={{ width: `${progress}%` }} />
                </div>

                {username !== "Admin 23"
                    ?
                    (
                        <div className="question-card">
                            <p className="question-text">{questions[currentQuestion].question}</p>
                            <ul className="answer-list">
                                {shuffledOptions.map((option) => (

                                    <li key={option}>
                                        <button
                                            className={`answer-button ${selectedAnswer === option ? 'selected' : ''}`}
                                            onClick={() => handleAnswerSelect(option)}
                                            type="button"
                                        >
                                            {option}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className="primary-button"
                                onClick={handleNextQuestion}
                                disabled={selectedAnswer === null}
                                type="button"
                            >
                                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </button>
                        </div>
                    )
                    :
                    (
                        <div className="question-card admin-card">
                            <input
                                type="number"
                                // value={selectedQuestionIndex}
                                onChange={(e) => {
                                    const index = parseInt(e.target.value, 10);
                                    if (!isNaN(index) && index >= 0 && index < originalQuestions.length) {

                                        setAdminTestQuestion(index); //parseInt(e.target.value, 10);

                                        // console.log("Original Question:", originalQuestions[adminTestQuestion]); // Log the original question for verification
                                    }
                                }}
                                placeholder="Enter original question index"
                                className="admin-input"
                            />
                            <button className="secondary-button" onClick={() => console.log(originalQuestions[adminTestQuestion])} type="button">Check</button>

                            {questions[currentQuestion] && (
                                <>
                                    <p className="question-text">
                                        {questions[currentQuestion].question}
                                    </p>
                                    <ul className="answer-list">

                                        {shuffledOptions.map((option) => (

                                            <li key={option}>
                                                <button
                                                    className={`answer-button ${selectedAnswer === option ? 'selected' : ''}`}
                                                    onClick={() => handleAnswerSelect(option)}
                                                    type="button"
                                                >
                                                    {option}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            <button
                                className="primary-button"
                                onClick={handleNextQuestion}
                                disabled={selectedAnswer === null}
                                type="button"
                            >
                                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </button>
                        </div>
                    )
                }
            </section>
        </main>
    );
}

export default Quiz;
