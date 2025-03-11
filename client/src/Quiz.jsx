import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

function Quiz( {username} ) {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState([])

    useEffect(() => {
        async function loadQuestions() {
            try {
                const response = await fetch('/questions.json');
                const data = await response.json();
                setQuestions(data);
            } catch (error) {
                console.error("Error loading questions:", error);
            }
        }

        loadQuestions();
    }, []);

    const handleAnswerSelect = (answer) => {
        setSelectedAnswer(answer);
    };

    const handleNextQuestion = () => {
        if (selectedAnswer === questions[currentQuestion].correctAnswer) {
            setScore(score + 1);
        } else {
            setWrongAnswers((prev) => [
                ...prev,
                questions[currentQuestion]
            ])

        }

        setSelectedAnswer(null);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setQuizFinished(true);
        }
    };

    const sendEmail = (username) => {
        const percentage = ((score / questions.length) * 100).toFixed(2);

        const templateParams = {
            from_name: username,
            score: score,
            totalQuestions: questions.length,
            percentage: percentage,
            wrongAnswers: JSON.stringify(wrongAnswers, null, 2)
        };

        emailjs.send('service_pcnfdzu', 'template_ptulihe', templateParams, '-QcsYaoZ84q24igTs')
        .then((response) => {
            console.log('SUCCESS!', response.status, response.text);
          })
          .catch((error) => {
            console.error('FAILED...', error);
          });
    };

    if (questions.length === 0) {
        return <p>Loading questions...</p>;
    }

    if (quizFinished) {
        const percentage = ((score / questions.length) * 100).toFixed(2);
        sendEmail(username); // Replace 'Your Name' with the actual username

        return (
            <div>
                <h2>Quiz Finished!</h2>
                <p>Your Score: {score} / {questions.length}</p>
                <p>Percentage of Correct Answers: </p>
                <p>{percentage}%</p>
            </div>
        );
    }

    const { question, options } = questions[currentQuestion];

    return (
        <div>
            <h2>Question {currentQuestion + 1}</h2>
            {console.log("score", score, questions)}
            {console.log("Wrong", wrongAnswers)}
            <p>{question}</p>
            <ul>
                {options.map((option) => (
                    <li key={option}>
                        <button
                            onClick={() => handleAnswerSelect(option)}
                            disabled={selectedAnswer !== null}
                            style={{ backgroundColor: selectedAnswer === option ? 'lightblue' : '' }}
                        >
                            {option}
                        </button>
                    </li>
                ))}
            </ul>
            <button onClick={handleNextQuestion} disabled={selectedAnswer === null}>
                Next Question
            </button>
        </div>
    );
}

export default Quiz;
