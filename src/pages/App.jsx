import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WatchRoom from "./pages/WatchRoom";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/room/:roomId" element={<WatchRoom />} />
                <Route path="/" element={<div className="text-white p-10">Home Page</div>} />
            </Routes>
        </Router>
    );
}

export default App;