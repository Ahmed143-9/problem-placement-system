import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProblemForm from "./MyComponents/ProblemForm";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProblemForm />} />
      </Routes>
    </Router>
  );
}

export default App;
