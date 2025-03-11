# Code Citations

## License: unknown
https://github.com/parthshaha4121/Demo/blob/d4526b406440fc0f7d22e4a4457b26001e7d3dfc/src/components/Quiz.js

```
;
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === questions[current
```


## License: unknown
https://github.com/parthshaha4121/Demo/blob/d4526b406440fc0f7d22e4a4457b26001e7d3dfc/src/components/Quiz.js

```
;
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
```

