import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import { BoxWordsScreen } from './screens/BoxWordsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LoginScreen } from './screens/LoginScreen'
import { QuizScreen } from './screens/QuizScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { StatsScreen } from './screens/StatsScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/"
        element={
          <AuthGate>
            <HomeScreen />
          </AuthGate>
        }
      />
      <Route
        path="/quiz/:direction"
        element={
          <AuthGate>
            <QuizScreen />
          </AuthGate>
        }
      />
      <Route
        path="/review"
        element={
          <AuthGate>
            <ReviewScreen />
          </AuthGate>
        }
      />
      <Route
        path="/stats"
        element={
          <AuthGate>
            <StatsScreen />
          </AuthGate>
        }
      />
      <Route
        path="/stats/:direction/:box"
        element={
          <AuthGate>
            <BoxWordsScreen />
          </AuthGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
