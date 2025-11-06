import React, { useState } from 'react';

export default function ActionCommentModal({ show, onClose, onConfirm, actionType, title }) {
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!comment.trim()) {
      alert('Please enter a reason/comment');
      return;
    }
    onConfirm(comment.trim());
    setComment('');
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">{title || 'Action Reason Required'}</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={() => {
                setComment('');
                onClose();
              }}
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3">
              Please provide a reason/comment for this action:
            </p>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Enter your reason here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              autoFocus
            ></textarea>
            <small className="text-muted">
              This will be recorded in the action history.
            </small>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setComment('');
                onClose();
              }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              Confirm Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}