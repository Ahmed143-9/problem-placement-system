// src/pages/ProblemCreate.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaPlusCircle, FaTimes, FaSpinner } from 'react-icons/fa';

const SERVICES = [
  'Bulk SMS -> WinText',
  'Topup -> Winfin',
  'Whatsapp Solution -> Infobip <-> Omnichannel channel',
  'Email Solution -> Infobip <-> Omnichannel channel',
  'Push-Pull -> VAS',
  'Games -> VAS',
  'DCB -> VAS',
  'Emergency Balance Service -> platform(Win vantage)',
  'International SMS -> infoBip <--> international channel',
  'Invoice Solution -> Win Vantage (platform)',
  'Campaign -> Customized development',
  'Web Solution -> Customized development',
];

const DEPARTMENTS = [
  'Enterprise Business Solutions',
  'Board Management',
  'Support Stuff',
  'Administration and Human Resources',
  'Finance and Accounts',
  'Business Dev and Operations',
  'Implementation and Support',
  'Technical and Networking Department'
];

export default function ProblemCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    statement: '',
    department: '',
    service: '',
    priority: 'Medium',
    description: '',
    client: '',
    assigned_to: '',
    images: [] // store uploaded URLs
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Upload image immediately when files are selected
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check total images limit
    if (files.length + previewImages.length > 5) {
      toast.warning('Maximum 5 images allowed', { autoClose: 3000 });
      e.target.value = ''; // Reset file input
      return;
    }
    
    setUploadingImages(true);
    const token = localStorage.getItem('token');
    const uploadedUrls = [];
    const newPreviews = [];

    // Upload each file one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
        if (!file.type.startsWith('image/')) {
        toast.warning(`${file.name} is not an image file`, { autoClose: 3000 });
        continue;
      }

      // Validate file size (e.g., 5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.warning(`${file.name} exceeds 5MB limit`, { autoClose: 3000 });
        continue;
      }

      // Create preview immediately
      const previewUrl = URL.createObjectURL(file);
      const tempPreview = {
        url: previewUrl,
        name: file.name,
        uploading: true,
        file: file
      };
      newPreviews.push(tempPreview);
      setPreviewImages(prev => [...prev, tempPreview]);

      // Prepare form data for upload
      const uploadData = new FormData();
      uploadData.append('file', file);

      try {
        // Replace {{url}} with your actual API base URL
        const uploadUrl = 'https://ticketapi.wineds.com/api/v1/general/file/file-upload';
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            // Don't set Content-Type for FormData, let browser set it
          },
          body: uploadData
        });

        const data = await response.json();
        
        if (data.status === 'success' && data.data?.url) {
          // Update the preview with actual URL
          setPreviewImages(prev => 
            prev.map(img => 
              img.name === file.name 
                ? { ...img, url: data.data.url, uploading: false } 
                : img
            )
          );
          
          uploadedUrls.push(data.data.url);
          
          // Update form data with new URLs
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.data.url]
          }));
          
        } else {
          toast.error(`Failed to upload ${file.name}: ${data.messages?.[0] || 'Unknown error'}`, { autoClose: 3000 });
          // Remove failed upload from preview
          setPreviewImages(prev => prev.filter(img => img.name !== file.name));
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: Network error`, { autoClose: 3000 });
        // Remove failed upload from preview
        setPreviewImages(prev => prev.filter(img => img.name !== file.name));
      }
    }
    
    setUploadingImages(false);
    e.target.value = ''; // Reset file input after upload
  };

  const removeImage = async (index) => {
    const imageToRemove = previewImages[index];
    
    // Clean up object URL if it's a temporary preview
    if (imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    // Remove from preview
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
    
    // Remove from form data
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if images are still uploading
      if (uploadingImages) {
        toast.warning('Please wait for images to finish uploading', { autoClose: 3000 });
        setLoading(false);
        return;
      }

      // Check if any image failed to upload
      const failedUploads = previewImages.filter(img => img.uploading);
      if (failedUploads.length > 0) {
        toast.warning('Some images are still uploading or failed. Please try again.', { autoClose: 3000 });
        setLoading(false);
        return;
      }

      if (!formData.statement || !formData.department || !formData.priority) {
        toast.error('Please fill all required fields', { autoClose: 3000 });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      // Create payload (adjust fields as needed for your backend)
      const payload = {
        statement: formData.statement,
        department: formData.department,
        priority: formData.priority,
        description: formData.description || '',
        assigned_to: formData.assigned_to || null,
        created_by: user?.id,
        images: formData.images // This now contains uploaded URLs
      };

      // Log payload for debugging
      console.log('Submitting payload:', payload);

      const response = await fetch('https://ticketapi.wineds.com/api/problems/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (data.status === 'success') {
        const message = data.messages?.[0] || 'Problem created successfully';
          toast.success(message, { autoClose: 3000 });
        
        // Clean up all preview URLs
        previewImages.forEach(img => {
          if (img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
        
        // Reset form
        setFormData({
          statement: '',
          department: '',
          service: '',
          priority: 'Medium',
          description: '',
          client: '',
          assigned_to: '',
          images: []
        });
        setPreviewImages([]);
        
        // Navigate after success
        setTimeout(() => {
          navigate(user?.role === 'admin' || user?.role === 'team_leader' ? '/problems' : '/employee-dashboard');
        }, 1000);
      } else {
        const errorMsg = data.messages?.[0] || 'Failed to create problem';
        toast.error(errorMsg, { autoClose: 3000 });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to create problem. Please try again.', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <Navbar />
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0"><FaPlusCircle className="me-2" /> Create New Problem</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Department *</label>
                <select 
                  name="department" 
                  className="form-control" 
                  value={formData.department} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Priority *</label>
                <select 
                  name="priority" 
                  className="form-control" 
                  value={formData.priority} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="col-12 mb-3">
                <label className="form-label fw-bold">Problem Statement *</label>
                <textarea 
                  name="statement" 
                  className="form-control" 
                  rows="3"
                  value={formData.statement} 
                  onChange={handleInputChange} 
                  placeholder="Describe the problem in detail..."
                  required
                ></textarea>
              </div>

              <div className="col-12 mb-3">
                <label className="form-label fw-bold">Description (Optional)</label>
                <textarea 
                  name="description" 
                  className="form-control" 
                  rows="2"
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Additional details..."
                ></textarea>
              </div>

              <div className="col-12 mb-4">
                <label className="form-label fw-bold">Upload Screenshots</label>
                <div className="mb-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageUpload} 
                    disabled={previewImages.length >= 5 || uploadingImages}
                    className="form-control" 
                    id="imageUpload"
                  />
                  <small className="text-muted">Max 5 images (PNG, JPG, JPEG). Max size: 5MB each.</small>
                </div>
                
                {/* Upload Progress */}
                {uploadingImages && (
                  <div className="alert alert-info d-flex align-items-center">
                    <FaSpinner className="fa-spin me-2" />
                    <span>Uploading images...</span>
                  </div>
                )}
                
                {/* Image Preview */}
                {previewImages.length > 0 && (
                  <div className="mt-3">
                    <h6>Uploaded Images ({previewImages.length}/5):</h6>
                    <div className="d-flex flex-wrap gap-3">
                      {previewImages.map((img, index) => (
                        <div key={index} className="position-relative border rounded p-2">
                          <img 
                            src={img.url} 
                            alt={img.name} 
                            style={{ 
                              height: '120px', 
                              width: '120px', 
                              objectFit: 'cover',
                              opacity: img.uploading ? 0.5 : 1
                            }} 
                            className="rounded"
                          />
                          {img.uploading ? (
                            <div className="position-absolute top-50 start-50 translate-middle">
                              <FaSpinner className="fa-spin text-primary" />
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm position-absolute" 
                              style={{ top: 5, right: 5 }} 
                              onClick={() => removeImage(index)}
                              title="Remove image"
                            >
                              <FaTimes />
                            </button>
                          )}
                          <div className="text-center small mt-1">
                            {img.uploading ? 'Uploading...' : 'Uploaded'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <Link to={user?.role === 'admin' || user?.role === 'team_leader' ? '/problems' : '/employee-dashboard'} className="btn btn-secondary">
                Cancel
              </Link>
              <button 
                type="submit" 
                className="btn btn-primary px-4" 
                disabled={loading || uploadingImages}
              >
                {loading ? (
                  <>
                    <FaSpinner className="fa-spin me-2" />
                    Creating...
                  </>
                ) : (
                  'Create Problem'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}