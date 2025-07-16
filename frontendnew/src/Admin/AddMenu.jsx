import React, { useState, useEffect } from 'react';

const AddMenu = ({ selectedOption, setActiveMenu, isLoggedIn }) => {
  // Load student data from localStorage or initialize with default values
  const [studentData, setStudentData] = useState(() => {
    const savedData = localStorage.getItem("studentForm");
    return savedData ? JSON.parse(savedData) : {
      rollno: '',
      name: '',
      department: '',
      year: '',
      class: '',
      email: '',
      semester: '',
      whatsapp: '',
      language: '',
    };
  });

  // Load advisor data from localStorage or initialize with default values
  const [advisorData, setAdvisorData] = useState(() => {
    const savedData = localStorage.getItem("advisorForm");
    return savedData ? JSON.parse(savedData) : {
      advisorid: '',
      name: '',
      department: '',
      year: '',
      class: '',
      semester: '',
      username: '',
      password: '',
      mobile: '',
    };
  });

  // Load admin data from localStorage or initialize with default values
  const [adminData, setAdminData] = useState(() => {
    const savedData = localStorage.getItem("adminForm");
    return savedData ? JSON.parse(savedData) : {
      name: '',
      department: '',
      year: '',
      mobile: '',
      username: '',
      password: '',
    };
  });

  // Save data to localStorage on change
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("studentForm", JSON.stringify(studentData));
      localStorage.setItem("advisorForm", JSON.stringify(advisorData));
      localStorage.setItem("adminForm", JSON.stringify(adminData));
    }
  }, [studentData, advisorData, adminData, isLoggedIn]);

  // Clear localStorage on logout
  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.removeItem("studentForm");
      localStorage.removeItem("advisorForm");
      localStorage.removeItem("adminForm");
    }
  }, [isLoggedIn]);

  // Handle input changes
  const handleStudentChange = (e) => setStudentData({ ...studentData, [e.target.name]: e.target.value });
  const handleAdvisorChange = (e) => setAdvisorData({ ...advisorData, [e.target.name]: e.target.value });
  const handleAdminChange = (e) => setAdminData({ ...adminData, [e.target.name]: e.target.value });

  // Form submissions
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Student added!');
        localStorage.removeItem("studentForm");
        setStudentData({
          rollno: '', name: '', department: '', year: '', class: '',
          email: '', semester: '', whatsapp: '', language: ''
        });
      } else alert(`❌ Error: ${result.message}`);
    } catch (err) {
      alert('⚠ Network error');
    }
  };

  const handleAdvisorSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/add-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advisorData),
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Advisor added!');
        localStorage.removeItem("advisorForm");
        setAdvisorData({
          advisorid: '', name: '', department: '', year: '', class: '',
          semester: '', username: '', password: '', mobile: ''
        });
      } else alert(`❌ Error: ${result.message}`);
    } catch (err) {
      alert('⚠ Network error');
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/add-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Admin added!');
        localStorage.removeItem("adminForm");
        setAdminData({
          name: '', department: '', year: '', mobile: '', username: '', password: ''
        });
      } else alert(`❌ Error: ${result.message}`);
    } catch (err) {
      alert('⚠ Network error');
    }
  };

  // Bulk upload modal logic
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const toggleBulkUploadModal = () => {
    setShowBulkUploadModal(!showBulkUploadModal);
    setSelectedFile(null);
  };

  const handleFileSelection = (e) => {
    setSelectedFile(e.target.files[0]);
  };

 const handleFileUpload = async () => {
  if (!selectedFile) return alert('❌ No file selected');

  const currentUser = { username: 'admin' }; // TEMPORARY — replace with real user later
  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('uploadedBy', currentUser.username); // Required field

  const endpointMap = {
    'add-student': '/api/admin/bulk-upload-students',
    'add-advisor': '/api/admin/bulk-upload-advisors',
    'add-admin': '/api/admin/bulk-upload-admins'
  };

  const endpoint = endpointMap[selectedOption];
  if (!endpoint) return alert('❌ Invalid upload option');

  try {
    // Step 1: Bulk upload data
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();

    if (!res.ok) {
      alert(`❌ Upload failed: ${result.message}`);
      return;
    }

    // Step 2: Store file metadata
    const fileRes = await fetch('http://localhost:5000/api/admin/upload-file', {
      method: 'POST',
      body: formData
    });

    const fileResult = await fileRes.json();

    if (fileRes.ok) {
      alert(`✅ Upload successful`);
      toggleBulkUploadModal();
    } else {
      alert(`⚠ File uploaded, but metadata not stored: ${fileResult.message}`);
    }
  } catch (err) {
    console.error('Upload error:', err);
    alert('⚠ Network error during upload');
  }
};
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-blue-100 relative overflow-hidden rounded-lg">
      {/* Bulk Button */}
      <button
        className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-green-500 text-white px-3 py-1 sm:px-6 sm:py-3 text-xs sm:text-base rounded-lg shadow-lg hover:bg-green-600 transition-all z-[10]"
        onClick={toggleBulkUploadModal}
      >
        Add Bulk
      </button>

      {/* Background Image */}
      <div className="hidden sm:flex absolute w-full h-full justify-center items-center">
        <img
          src={require('../assets/YellowPaint.png')}
          alt="Background Paint"
          className="w-4/4 top-[10px] max-w-[1180px] h-auto opacity-80"
        />
      </div>

      {/* Form Section */}
      <div className={`p-6 sm:p-10 rounded-lg shadow-lg w-full sm:w-1/2 mt-16 mb-16 relative z-10 flex flex-col items-center ${
        selectedOption.startsWith('add') ? '' : 'hidden'
      } sm:bg-[#f9fafb]`}
      >
        {/* Arrow indicator image (only visible on desktop) */}
        <img
          src={require('../assets/arrowblue.png')}
          alt="Arrow Indicator"
          className="hidden sm:block absolute top-[-45px] right-[-170px] w-28 h-28 opacity-90"
        />

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
          Add{' '}
          {selectedOption === 'add-student'
            ? 'Student'
            : selectedOption === 'add-advisor'
            ? 'Advisor'
            : 'Admin'}
        </h2>

        {/* Student Form */}
        {selectedOption === 'add-student' && (
          <form onSubmit={handleStudentSubmit} className="flex flex-col gap-4 w-full">
            {Object.keys(studentData).map((key) => (
              <input
                key={key}
                type="text"
                name={key}
                value={studentData[key]}
                onChange={handleStudentChange}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                className="p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                required
              />
            ))}
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
            >
              Submit
            </button>
          </form>
        )}

        {/* Advisor Form */}
        {selectedOption === 'add-advisor' && (
          <form onSubmit={handleAdvisorSubmit} className="flex flex-col gap-4 w-full">
            {Object.keys(advisorData).map((key) => (
              <input
                key={key}
                type="text"
                name={key}
                value={advisorData[key]}
                onChange={handleAdvisorChange}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                className="p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                required
              />
            ))}
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
            >
              Submit
            </button>
          </form>
        )}

        {/* Admin Form */}
        {selectedOption === 'add-admin' && (
          <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4 w-full">
            {Object.keys(adminData).map((key) => (
              <input
                key={key}
                type="text"
                name={key}
                value={adminData[key]}
                onChange={handleAdminChange}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                className="p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                required
              />
            ))}
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
            >
              Submit
            </button>
          </form>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Bulk Upload{' '}
                {selectedOption === 'add-student'
                  ? 'Students'
                  : selectedOption === 'add-advisor'
                  ? 'Advisors'
                  : 'Admins'}
              </h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={toggleBulkUploadModal}>
                &times;
              </button>
            </div>
            <p className="mb-4 text-sm">
              Please upload an Excel file (.xls or .xlsx) in this format:
              <br />
              {selectedOption === 'add-student'
                ? 'rollno || name || department || year || class || email || semester || WhatsApp || language'
                : selectedOption === 'add-advisor'
                ? 'advisorid || name || department || year || class || semester || username || password || mobile'
                : 'name || department || year || mobile || username || password'}
            </p>
            <div className="flex items-center mb-4">
              <label
                htmlFor="bulkFile"
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-l-md cursor-pointer hover:bg-gray-100"
              >
                Choose File
              </label>
              <input id="bulkFile" type="file" accept=".xls,.xlsx" onChange={handleFileSelection} className="hidden" />
              <span className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-r-md ml-1">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
            <button
              type="button"
              className="w-full bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
              onClick={handleFileUpload}
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMenu;