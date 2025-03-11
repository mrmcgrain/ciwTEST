import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Quiz from './Quiz'

function App() {
  const [username, setUsername] = useState("")
  const [showQuiz, setShowQuiz] = useState(false)

  const handleSubmit = () => {
    if (username.length) {
      setShowQuiz(true)

    }
  }

  return (
    <>
      {console.log("user", username)}

      {showQuiz
        ?
        (
          <Quiz username={username} />
        )
        :
        (
          <>
            <input placeholder="Please enter your Full name" onChange={(e) => setUsername(e.target.value)}></input >
            <br />
            <br />
            <button onClick={(e) => handleSubmit(e)}>Let'f GO! </button>
          </>
        )
      }




      {/* <Quiz /> */}
    </>
  )
}

export default App
