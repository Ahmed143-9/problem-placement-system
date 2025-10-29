import React, { useState } from "react";
import api from "../services/api";
import { ToastContainer, toast } from "react-toastify";

export default function ProblemForm() {
  const [formData, setFormData] = useState({
    department: "",
    priority: "",
    statement: "",
    image: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImage = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData();
  data.append("department", formData.department);
  data.append("priority", formData.priority);
  data.append("statement", formData.statement);
  if (formData.image) {
    data.append("image", formData.image);
  }

  try {
    await api.post("/problems", data);
    toast.success("Problem submitted successfully!");
    setFormData({ department: "", priority: "", statement: "", image: null });
  } catch (error) {
    if (error.response && error.response.data && error.response.data.errors) {
      console.error(error.response.data.errors); // shows Laravel validation errors
      toast.error("Validation failed, check your input!");
    } else {
      toast.error("Failed to submit problem!");
      console.error(error);
    }
  }
};


  return (
    <div className="container mt-4">
      <ToastContainer />
      <h3>Submit a Problem Ticket</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Department</label>
          <select
            className="form-control"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            <option value="Tech">Tech</option>
            <option value="Business">Business</option>
            <option value="Accounts">Accounts</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Priority</label>
          <select
            className="form-control"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
          >
            <option value="">Select Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Problem Statement</label>
          <textarea
            className="form-control"
            name="statement"
            value={formData.statement}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="mb-3">
          <label>Upload Image (optional)</label>
          <input
            type="file"
            className="form-control"
            onChange={handleImage}
            accept="image/*"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Submit Problem
        </button>
      </form>
    </div>
  );
}
