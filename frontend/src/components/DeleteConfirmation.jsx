import React from 'react';
import './DeleteConfirmation.css';

const DeleteConfirmation = ({ isVisible, onClose, onConfirm, msg }) => {
  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this {msg}?</p>
        <div className="modal-actions">
          <button className="confirm-btn" onClick={onConfirm}>Yes, Delete</button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
