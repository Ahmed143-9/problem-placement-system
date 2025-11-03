import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function Reports() {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    try {
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      setProblems(storedProblems);
      
      // Calculate stats
      const statsData = {
        total: storedProblems.length,
        pending: storedProblems.filter(p => p.status === 'pending').length,
        in_progress: storedProblems.filter(p => p.status === 'in_progress').length,
        done: storedProblems.filter(p => p.status === 'done').length,
        by_department: {
          Tech: storedProblems.filter(p => p.department === 'Tech').length,
          Business: storedProblems.filter(p => p.department === 'Business').length,
          Accounts: storedProblems.filter(p => p.department === 'Accounts').length
        },
        by_priority: {
          High: storedProblems.filter(p => p.priority === 'High').length,
          Medium: storedProblems.filter(p => p.priority === 'Medium').length,
          Low: storedProblems.filter(p => p.priority === 'Low').length
        }
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h3 className="mb-0">Live Progress Reports</h3>
            <button className="btn btn-light btn-sm" onClick={() => window.print()}>
              Print Report
            </button>
          </div>
          <div className="card-body">
            {/* Statistics Cards */}
            {stats && (
              <>
                <div className="row mb-4">
                  <div className="col-md-3 mb-3">
                    <div className="card border-primary">
                      <div className="card-body text-center">
                        <h2 className="text-primary mb-0">{stats.total}</h2>
                        <p className="text-muted mb-0">Total Problems</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-warning">
                      <div className="card-body text-center">
                        <h2 className="text-warning mb-0">{stats.pending}</h2>
                        <p className="text-muted mb-0">Pending</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-info">
                      <div className="card-body text-center">
                        <h2 className="text-info mb-0">{stats.in_progress}</h2>
                        <p className="text-muted mb-0">In Progress</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-success">
                      <div className="card-body text-center">
                        <h2 className="text-success mb-0">{stats.done}</h2>
                        <p className="text-muted mb-0">Completed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {stats.total > 0 && (
                  <div className="mb-4">
                    <h5>Overall Progress</h5>
                    <div className="progress" style={{ height: '30px' }}>
                      <div
                        className="progress-bar bg-warning"
                        style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                      >
                        {stats.pending > 0 && `${stats.pending}`}
                      </div>
                      <div
                        className="progress-bar bg-info"
                        style={{ width: `${(stats.in_progress / stats.total) * 100}%` }}
                      >
                        {stats.in_progress > 0 && `${stats.in_progress}`}
                      </div>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${(stats.done / stats.total) * 100}%` }}
                      >
                        {stats.done > 0 && `${stats.done}`}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted">
                        Pending: {((stats.pending / stats.total) * 100).toFixed(1)}%
                      </small>
                      <small className="text-muted">
                        In Progress: {((stats.in_progress / stats.total) * 100).toFixed(1)}%
                      </small>
                      <small className="text-muted">
                        Completed: {((stats.done / stats.total) * 100).toFixed(1)}%
                      </small>
                    </div>
                  </div>
                )}

                {/* Department Breakdown */}
                <div className="mb-4">
                  <h5>Problems by Department</h5>
                  <div className="row">
                    {Object.entries(stats.by_department).map(([dept, count]) => (
                      <div key={dept} className="col-md-4 mb-3">
                        <div className="card">
                          <div className="card-body">
                            <h6>{dept}</h6>
                            <h3 className="mb-0">{count}</h3>
                            <small className="text-muted">
                              {stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}% of total
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="mb-4">
                  <h5>Problems by Priority</h5>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className="card border-success">
                        <div className="card-body text-center">
                          <h4 className="text-success mb-0">{stats.by_priority.Low || 0}</h4>
                          <p className="text-muted mb-0">Low Priority</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-warning">
                        <div className="card-body text-center">
                          <h4 className="text-warning mb-0">{stats.by_priority.Medium || 0}</h4>
                          <p className="text-muted mb-0">Medium Priority</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-danger">
                        <div className="card-body text-center">
                          <h4 className="text-danger mb-0">{stats.by_priority.High || 0}</h4>
                          <p className="text-muted mb-0">High Priority</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Recent Problems */}
            <div>
              <h5>Recent Problems</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Department</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Assigned To</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <p className="text-muted mb-0">No problems found. Create your first problem to see reports!</p>
                        </td>
                      </tr>
                    ) : (
                      problems.slice().reverse().slice(0, 10).map(problem => (
                        <tr key={problem.id}>
                          <td>#{problem.id}</td>
                          <td>{problem.department}</td>
                          <td>
                            <span className={`badge ${
                              problem.priority === 'High' ? 'bg-danger' :
                              problem.priority === 'Medium' ? 'bg-warning text-dark' :
                              'bg-success'
                            }`}>
                              {problem.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              problem.status === 'pending' ? 'bg-warning text-dark' :
                              problem.status === 'in_progress' ? 'bg-info' :
                              'bg-success'
                            }`}>
                              {problem.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>{problem.createdBy}</td>
                          <td>{problem.assignedTo || 'Unassigned'}</td>
                          <td>{new Date(problem.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auto-Refresh Info */}
            <div className="alert alert-info mt-4">
              <strong>Live Data:</strong> This report shows real-time data from the system. 
              The statistics update automatically based on the current state of all problems.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}