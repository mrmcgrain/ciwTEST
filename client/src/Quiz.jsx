import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';

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
    // const [focusEvents, setFocusEvents] = useState([]);
    const [shuffledOptions, setShuffledOptions] = useState([]);
    // const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [originalQuestions, setOriginalQuestions] = useState([])
    const [adminTestQuestion, setAdminTestQuestion] = useState(false)
    //STate to display resultes to user
    const [results, setResults] = useState({
        // Test: "",
        // Name: "",
        // Score: "",
        // TotalQuestions: null,
        // percentage: null,
        // totalTime: null,
        // totalAwayTime: null,
        // wrongAnswers: "",
        // tabSwitches: null,
    })




    const intervalRef = useRef(null);

    // Add state for away tracking
    const [isAway, setIsAway] = useState(false);
    const [awayStartTime, setAwayStartTime] = useState(null);
    const [totalAwayTime, setTotalAwayTime] = useState(0);
    const [exitPoints, setExitPoints] = useState([]);

    // Move buttonStyle inside the component to avoid the invalid hook call error
    const buttonStyle = {
        width: '100%',
        padding: '10px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
    };


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
                const response = await fetch(`/${testType}`);
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
            if (intervalRef.current) clearInterval(intervalRef.current);
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





    // 
    // const sendEmail = (username) => {


    // console.log("EMAIL", templateParams)
    // emailjs.send('service_pcnfdzu', 'template_ptulihe', templateParams, '-QcsYaoZ84q24igTs')
    // emailjs.send('service_a0in6ii', 'template_tctf7om', templateParams, 'FMmd_SU-O_PCPoPTV')
    // .then((response) => {
    //     console.log('SUCCESS!', response.status, response.text);
    // })
    // .catch((error) => {
    //     console.error('FAILED...', error);
    // });
    // };

    const sendEmail = (username) => {

        const percentage = ((score / questions.length) * 100).toFixed(2);

        // Calculate final away time in case test ends while away
        let finalAwayTime = totalAwayTime;
        if (isAway && awayStartTime) {
            finalAwayTime += Math.floor((Date.now() - awayStartTime) / 1000);
        }

        const templateParams = {
            test_type: testType,
            from_name: username,
            score: score,
            totalQuestions: questions.length,
            percentage: percentage,
            totalTime: formatTime(totalTime),
            totalAwayTime: formatTime(finalAwayTime),
            wrongAnswers: JSON.stringify(wrongAnswers, null, 2),
            tabSwitches: tabSwitchCount,
            tabSwitchDetails: JSON.stringify(tabSwitchEvents, null, 2),
            exitPoints: JSON.stringify(exitPoints, null, 2)

        };

        console.log("EMAIL", templateParams)
    // emailjs.send('service_pcnfdzu', 'template_ptulihe', templateParams, '-QcsYaoZ84q24igTs')
    emailjs.send('service_a0in6ii', 'template_tctf7om', templateParams, 'FMmd_SU-O_PCPoPTV')
    .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
    })
    .catch((error) => {
        console.error('FAILED...', error);
    });

    }




    if (!testType) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                width: '100vw',
                textAlign: 'center'
            }}>
                <h1> {`Welcome ${username} `}</h1>
                <h2>Select Test Type</h2>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '300px',
                    maxWidth: '400px',
                    gap: '10px'
                }}>
                    <button onClick={() => setTestType('css.json')} style={buttonStyle}>CSS Test</button>
                    <button onClick={() => setTestType('html.json')} style={buttonStyle}>HTML Test</button>
                    <button onClick={() => setTestType('javaScript.json')} style={buttonStyle}>JavaScript Test</button>
                    <button onClick={() => setTestType('react.json')} style={buttonStyle}>React Test</button>
                    {/* <button onClick={() => setTestType('Oldbackend.json')} style={buttonStyle}>Backend Basic</button> */}
                    <button onClick={() => setTestType('backend.json')} style={buttonStyle}>Backend </button>
                    <button onClick={() => setTestType('secplus.json')} style={buttonStyle}>CompTIA Security+ Test</button>
                    <button onClick={() => setTestType('networkPlus.json')} style={buttonStyle}>Network+ Test</button>
                    {username === "Admin 23" && <button onClick={() => setTestType('test.json')} style={buttonStyle}>Test Exam</button>}
                    {username !== "Admin 23" && <button onClick={() => setTestType('test.json')} style={buttonStyle}>Test Exam</button>}
                    <button onClick={() => setTestType('ddd.json')} style={buttonStyle}>DDD Test</button>
                </div>
                <br />
                <h2> {`Happy Testing!!`}</h2>

            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                width: '100vw'
            }}>
                <p>Loading questions...</p>
            </div>
        );
    }

    if (quizFinished) {
        console.log("rwe", wrongAnswers)
        const percentage = ((score / questions.length) * 100).toFixed(2);
        sendEmail(username); // Re-enable email sending
        // let end = handleResults()

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                width: '100vw',
                textAlign: 'center'
            }}>
                {/* 
                {console.log(end)} */}
                <h2>Quiz Finished!</h2>
                <div style={{
                    width: '300px',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    <p>Your Score: {score} / {questions.length}</p>
                    <p>Percentage of Correct Answers: </p>
                    <p>{percentage}%</p>
                    <p>Total Time: {formatTime(totalTime)}</p>
                    <br />
                    <h3>Incorrect Answers</h3>

<hr />
                    {wrongAnswers.map(item => {

                        return (

                            <div style={{width: '100%', marginBottom: '10px', borderBottom: "1px white solid"}}>


                                {/* make comp for better formating, per 3. x */}
                                <p>{`Question:        ${item.question}`}</p>
                                <p>{`Your answer:     ${item.userAnswer} `}</p>
                                <p>{`Correct Answer : ${item.correctAnswer}`}</p>

                            </div>
                        )
                    })}
                

                    <button
                        onClick={() => window.location.reload()}
                        style={buttonStyle}
                    >
                        Take Another Test
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100vw',
            textAlign: 'center'
        }}>
            {showWarning && (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ff4d4d',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    zIndex: 1000,
                }}>
                    <p>
                        Warning: Tab switching detected! This will be recorded.
                    </p>
                </div>
            )}

            <div style={{
                width: '100%',
                maxWidth: '600px',
                padding: '20px'
            }}>


                {username !== "Admin 23"
                    ?
                    (
                        <div>
                            <h2>Question {currentQuestion + 1}</h2>
                            <p>Time elapsed: {formatTime(totalTime)}</p>
                            <p style={{ fontSize: '18px', margin: '20px 0' }}>{questions[currentQuestion].question}</p>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: '20px 0'
                            }}>
                                {/* {console.log("SRRA", shuffledOptions)} */}
                                {/* {options.map((option) => ( */}
                                {shuffledOptions.map((option) => (

                                    <li key={option} style={{ margin: '10px 0' }}>
                                        <button
                                            onClick={() => handleAnswerSelect(option)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: selectedAnswer === option ? '#a8d5ba' : '#f0f0f0',
                                                color: 'black',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {option}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={handleNextQuestion}
                                disabled={selectedAnswer === null}
                                style={{
                                    ...buttonStyle,
                                    opacity: selectedAnswer === null ? 0.5 : 1
                                }}
                            >
                                Next Question
                            </button>
                        </div>
                    )
                    :
                    (
                        <div>
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
                                style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
                            />
                            <button onClick={(e) => console.log(originalQuestions[adminTestQuestion])}>check</button>

                            <h2>Question {currentQuestion + 1}</h2>

                            {questions[currentQuestion] && (
                                <>
                                    <p style={{ fontSize: '18px', margin: '20px 0' }}>
                                        {questions[currentQuestion].question}
                                    </p>
                                    <ul style={{
                                        listStyle: 'none',
                                        padding: 0,
                                        margin: '20px 0'
                                    }}>

                                        {shuffledOptions.map((option) => (

                                            <li key={option} style={{ margin: '10px 0' }}>
                                                <button
                                                    onClick={() => handleAnswerSelect(option)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        backgroundColor: selectedAnswer === option ? '#a8d5ba' : '#f0f0f0',
                                                        color: 'black',
                                                        border: '1px solid #ccc',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    {option}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            <button
                                onClick={handleNextQuestion}
                                disabled={selectedAnswer === null}
                                style={{
                                    ...buttonStyle,
                                    opacity: selectedAnswer === null ? 0.5 : 1
                                }}
                            >
                                Next Question
                            </button>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default Quiz;
