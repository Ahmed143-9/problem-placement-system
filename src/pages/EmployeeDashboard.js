import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const MOTIVATIONAL_QUOTES = [
  "Great work starts with great attitude! 💪",
  "Every problem is an opportunity to shine! ✨",
  "You're making a difference, one solution at a time! 🌟",
  "Excellence is not a skill, it's an attitude! 🎯",
  "Stay focused, stay positive, stay productive! 🚀",
  "Your dedication drives success! 💼",
  "Together we solve, together we grow! 🌱",
  "Quality service, quality work! ⭐",
  "Innovation starts with you! 💡",
  "Keep pushing boundaries! 🏆"
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [randomQuote, setRandomQuote] = useState('');

  useEffect(() => {
    fetchUserProblems();
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  const fetchUserProblems = () => {
    try {
      const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      // User only sees problems assigned to them
      const userProblems = allProblems.filter(p => p.assignedTo === user?.name);
      
      setProblems(userProblems);
      
      const statsData = {
        my_problems: allProblems.filter(p => p.createdBy === user?.name).length,
        assigned_to_me: userProblems.length,
        in_progress: userProblems.filter(p => p.status === 'in_progress').length,
        completed: userProblems.filter(p => p.status === 'done').length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        {/* Motivational Banner */}
        <div className="alert alert-info mb-4 text-center" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          fontSize: '1.2rem',
          fontWeight: '500'
        }}>
          {randomQuote}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaClipboardList style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.my_problems}</h2>
                  <p className="mb-0">My Problems</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #f6c23e 0%, #dda20a 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaTasks style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.assigned_to_me}</h2>
                  <p className="mb-0">Assigned to Me</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #36b9cc 0%, #258fa4 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaSpinner style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.in_progress}</h2>
                  <p className="mb-0">In Progress</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaCheckCircle style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.completed}</h2>
                  <p className="mb-0">Completed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Problems */}
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">My Assigned Problems</h4>
          </div>
          <div className="card-body">
            {problems.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h5>No problems assigned to you right now!</h5>
                <p className="text-muted">Enjoy your time or help others!</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Department</th>
                      <th>Service</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map(problem => (
                      <tr key={problem.id}>
                        <td>#{problem.id}</td>
                        <td>{problem.department}</td>
                        <td>{problem.service}</td>
                        <td>
                          <span className={`badge ${
                            problem.priority === 'High' ? 'bg-danger' :
                            problem.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                          }`}>
                            {problem.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            problem.status === 'pending' ? 'bg-warning' :
                            problem.status === 'in_progress' ? 'bg-info' : 'bg-success'
                          }`}>
                            {problem.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <Link to={`/problem/${problem.id}`} className="btn btn-sm btn-primary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}