import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { HomePage } from './pages/HomePage'
import { PeoplePage } from './pages/PeoplePage'
import { CreateSchedulePage } from './pages/CreateSchedulePage'
import { AssignPage } from './pages/AssignPage'
import { ViewSchedulePage } from './pages/ViewSchedulePage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="p-4 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/schedule/new" element={<CreateSchedulePage />} />
            <Route path="/schedule/:id/assign" element={<AssignPage />} />
            <Route path="/schedule/:id" element={<ViewSchedulePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
