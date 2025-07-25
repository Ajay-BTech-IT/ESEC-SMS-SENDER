import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import ClipLoader from "react-spinners/ClipLoader"; // Import the spinner

// Set default for sending cookies with Axios
axios.defaults.withCredentials = true;

const AdvisorPage = () => {
  const navigate = useNavigate();
  const API_URL = 'http://localhost:5000/api/advisor';

  // State
  const [activeMenu, setActiveMenu] = useState('home');
  const [advisorDetails, setAdvisorDetails] = useState({
    name: '',
    department: '',
    semester: '',
    year: '',
    mobile: ''
  });
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Bulk Send Marks States
  const [selectedStudentsForMarks, setSelectedStudentsForMarks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Subject & Marks States
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [numSubjects, setNumSubjects] = useState('');
  const [subjects, setSubjects] = useState([]); // For the modal input
  const [configuredSubjects, setConfiguredSubjects] = useState([]); // <-- New state for fetched subjects
  const [subjectsLoading, setSubjectsLoading] = useState(false); // <-- New state for loading subjects

  // Upload Modal States
  const [showModal, setShowModal] = useState(false);
  const [uploadExamType, setUploadExamType] = useState('');
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false); // <-- State for upload loading
  const [uploadSuccess, setUploadSuccess] = useState(false); // <-- State for upload success
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState(''); // <-- State for success message

  // Exam Type Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState('');

  // Fetch advisor details on load
  useEffect(() => {
    const fetchAdvisorDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/get-advisor-details`, {
          withCredentials: true,
        });
        if (response.status === 200) {
          setAdvisorDetails({
            name: response.data.name || 'Advisor',
            department: response.data.department || 'Department',
            semester: response.data.semester || 'Semester',
            year: response.data.year || 'Year',
            mobile: response.data.mobile || 'Not Available'
          });
        }
      } catch (err) {
        console.error('Error fetching advisor info:', err.message);
        navigate('/login');
      }
    };
    fetchAdvisorDetails();
  }, [navigate]);

  // Fetch students when "Students" tab is active
  useEffect(() => {
    if (activeMenu === 'students') {
      const fetchStudents = async () => {
        try {
          const res = await axios.get(`${API_URL}/get-students`, {
            params: {
              department: advisorDetails.department,
              year: advisorDetails.year,
              semester: advisorDetails.semester,
            },
            withCredentials: true,
          });
          if (res.status === 200) {
            setStudents(res.data);
          }
        } catch (err) {
          console.error('Failed to fetch students:', err.message);
        }
      };
      fetchStudents();
    }
  }, [activeMenu, advisorDetails]);

  // Fetch configured subjects when "Subject & Marks" tab is active or advisorDetails change
  useEffect(() => {
    if (activeMenu === 'subjectMarks' || (selectedStudent && activeMenu === 'students')) {
      const fetchConfiguredSubjects = async () => {
        // Ensure advisor details are loaded before fetching subjects
        if (!advisorDetails.department || !advisorDetails.year || !advisorDetails.semester) {
            // console.log("Advisor details not fully loaded yet for subjects fetch.");
            return;
        }

        setSubjectsLoading(true);
        try {
          const res = await axios.get(`${API_URL}/get-subjects`, {
            params: {
              department: advisorDetails.department,
              year: advisorDetails.year,
              semester: advisorDetails.semester,
            },
            withCredentials: true,
          });
          if (res.data.success) {
            setConfiguredSubjects(res.data.subjects || []);
          } else {
            console.error('Failed to fetch subjects:', res.data.message);
            setConfiguredSubjects([]);
          }
        } catch (err) {
          console.error('Error fetching subjects:', err.message);
          setConfiguredSubjects([]);
        } finally {
          setSubjectsLoading(false);
        }
      };
      fetchConfiguredSubjects();
    }
  }, [activeMenu, selectedStudent, advisorDetails]); // Depend on advisorDetails, activeMenu, and selectedStudent

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await axios.get(`${API_URL}/get-marks`, {
        params: {
          rollno: student.rollno,
          semester: advisorDetails.semester,
          department: advisorDetails.department
        },
        withCredentials: true
      });
      if (res.status === 200) {
        const data = res.data;
        const subjectMap = {};
        data.subjects.forEach(subj => {
          subjectMap[subj.subject_code] = subj.subject_name;
        });
        const marksTable = Object.keys(subjectMap).map(code => ({
          subjectCode: code,
          subjectName: subjectMap[code],
          cat1: data.CAT1[code] || '-',
          cat2: data.CAT2[code] || '-',
          cat3: data.CAT3[code] || '-',
          model: data.MODEL[code] || '-'
        }));
        setSelectedStudent(prev => ({
          ...prev,
          marksTable
        }));
      }
    } catch (err) {
      console.error('Failed to fetch marks:', err.message);
      setSelectedStudent((prev) => ({
        ...prev,
        marksTable: [],
      }));
    }
  };

  const handleBulkSendMarksWithType = async (examType) => {
    if (!selectedStudentsForMarks.length) {
      alert('Please select at least one student.');
      return;
    }
    const payload = {
      marksData: selectedStudentsForMarks.map((s) => ({
        rollno: s.rollno,
        examType: examType,
      })),
    };
    try {
      const res = await axios.post(`${API_URL}/send-marks`, payload, {
        withCredentials: true,
      });
      if (res.data.success) {
        alert('✅ Marks sent successfully!');
      } else {
        alert('❌ Some marks failed to send.');
      }
    } catch (err) {
      console.error('🚨 Error sending marks:', err.message);
      alert('❌ Currently not able to send message.');
    }
  };

  // Render the list of configured subjects
  const renderSubjectsList = () => {
    if (subjectsLoading) {
        return <p className="text-gray-500 italic">Loading subjects...</p>;
    }
    if (!configuredSubjects.length) {
        return <p className="text-gray-500 italic">No subjects configured for this semester.</p>;
    }
    return (
      <div className="mt-4 overflow-x-auto">
        <h3 className="text-lg font-bold mb-2">Subjects</h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Subject Code</th>
              <th className="border border-gray-300 px-4 py-2">Subject Name</th>
            </tr>
          </thead>
          <tbody>
            {configuredSubjects.map((subject, idx) => (
              <tr key={subject.subject_code} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-4 py-2">{subject.subject_code}</td>
                <td className="border border-gray-300 px-4 py-2">{subject.subject_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


  const renderMarksTable = () => {
    if (!selectedStudent?.marksTable?.length) {
      return <p className="text-gray-500 italic mt-4">No marks data found for this student yet.</p>;
    }
    return (
      <div className="mt-4 overflow-x-auto">
        <h3 className="text-lg font-bold mb-2">Marks</h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Subject Code</th>
              <th className="border border-gray-300 px-4 py-2">Subject Name</th>
              <th className="border border-gray-300 px-4 py-2">CAT1</th>
              <th className="border border-gray-300 px-4 py-2">CAT2</th>
              <th className="border border-gray-300 px-4 py-2">CAT3</th>
              <th className="border border-gray-300 px-4 py-2">Model</th>
            </tr>
          </thead>
          <tbody>
            {selectedStudent.marksTable.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-4 py-2">{row.subjectCode}</td>
                <td className="border border-gray-300 px-4 py-2">{row.subjectName}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{row.cat1}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{row.cat2}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{row.cat3}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{row.model}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleCheckboxChange = (student) => {
    const isSelected = selectedStudentsForMarks.some((s) => s.rollno === student.rollno);
    if (isSelected) {
      setSelectedStudentsForMarks((prev) =>
        prev.filter((s) => s.rollno !== student.rollno)
      );
    } else {
      setSelectedStudentsForMarks((prev) => [...prev, student]);
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedStudentsForMarks(students); // Select all students
    } else {
      setSelectedStudentsForMarks([]); // Deselect all
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/api/auth/logout', {
        withCredentials: true,
      });
    } finally {
      navigate('/login');
    }
  };

  const openSubjectModal = () => {
    setNumSubjects('');
    setSubjects([]);
    setShowSubjectModal(true);
  };

  const handleNumSubjectsChange = (e) => {
    setNumSubjects(e.target.value);
  };

  const generateSubjectInputs = () => {
    const count = parseInt(numSubjects);
    if (isNaN(count) || count <= 0) {
      alert('Please enter a valid number of subjects.');
      return;
    }
    const newSubjects = Array.from({ length: count }, (_, i) => ({
      code: '',
      name: '',
    }));
    setSubjects(newSubjects);
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index][field] = value;
    setSubjects(updatedSubjects);
  };

  const handleUpdateSubjects = () => {
    if (!subjects.some((subj) => subj.code && subj.name)) {
      alert('Please fill in all subject codes and names.');
      return;
    }
    const payload = {
      subjects,
      department: advisorDetails.department,
      year: advisorDetails.year,
      semester: advisorDetails.semester
    };
    axios
      .post(`${API_URL}/add-subjects`, payload, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          alert(res.data.message);
          setShowSubjectModal(false);
          // Trigger a refresh of subjects after adding new ones
          // The useEffect will run because advisorDetails haven't changed,
          // but we can force it by temporarily changing a dummy state or
          // simply call fetchConfiguredSubjects again here.
          // For now, let's just rely on the useEffect trigger via activeMenu change
          // if needed, setActiveMenu(prev => prev); // This might help trigger useEffect if needed immediately
        } else {
          alert('❌ Failed to save subjects.');
        }
      })
      .catch((err) => {
        console.error('Error saving subjects:', err.message);
        alert('❌ Error saving subjects. Check console for details.');
      });
  };

  const handleUploadClick = (examType) => {
    setUploadExamType(examType);
    setShowModal(true);
    // Reset success states when opening the modal
    setUploadSuccess(false);
    setUploadSuccessMessage('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Reset success states if a new file is selected
    if (selectedFile) {
        setUploadSuccess(false);
        setUploadSuccessMessage('');
    }
    // Optional: You might want to remove the automatic preview/alert here
    // as it runs on file selection, not upload.
    /*
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      if (json.length > 0) {
        const sampleRow = json[0];
        const subjectsFound = Object.keys(sampleRow).filter(
          (key) => !['student_rollno', 'student_name'].includes(key.trim())
        );
        alert("Detected Subjects: " + subjectsFound.join(', '));
      }
    };
    reader.readAsBinaryString(selectedFile);
    */
  };

  // Modified handleUploadSubmit to include loading state and custom success UI
  const handleUploadSubmit = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    // Reset states at the start of a new upload
    setUploadSuccess(false);
    setUploadSuccessMessage('');
    setUploadLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('examType', uploadExamType);

    try {
      const res = await axios.post(`${API_URL}/upload-marks`, formData, {
        withCredentials: true,
      });

      // Stop loading indicator
      setUploadLoading(false);

      if (res.data.success) {
        // Set success state and message
        setUploadSuccess(true);
        setUploadSuccessMessage(res.data.message); // "Uploaded Successfully"
        // Optionally, trigger a refresh of student data or subjects here if needed
        // e.g., if the upload adds new subjects implicitly (though add-subjects is preferred)
        // setStudents(prevStudents => [...prevStudents]); // Or refetch logic
        // fetchConfiguredSubjects(); // Re-fetch subjects if upload might have affected them
      } else {
        // Handle server-side errors that are not exceptions
        alert(`Error: ${res.data.message}`);
         // Reset loading state on server error within 2xx range
         setUploadLoading(false);
      }
    } catch (err) {
      // Stop loading indicator on error as well
      setUploadLoading(false);

      console.error('Upload error:', err.message);
      // Provide more user-friendly error messages if possible
      if (err.response) {
         // Server responded with error status
         alert(`Upload failed: ${err.response.data.message || err.message}`);
      } else if (err.request) {
         // Request was made but no response received
         alert(`Upload failed: No response from server.`);
      } else {
         // Something else happened
         alert(`Upload failed: ${err.message}`);
      }
    }
  };

  // Function to close the modal and reset states
  const closeModal = () => {
    setShowModal(false);
    setUploadLoading(false);
    setUploadSuccess(false);
    setUploadSuccessMessage('');
    setFile(null); // Clear the file input state
    // Optionally reset the file input element itself if needed using a ref
    // if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* Font Import */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caprasimo&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
        `}
      </style>
      <div className="flex flex-col min-h-screen bg-gray-100 font-roboto">
        {/* Header */}
        <header className="bg-[#292969] text-white p-4 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 mb-2 md:mb-0">
              <img src={require('../assets/eseclogo.jpg')} alt="ESEC Logo" className="w-8 h-8 rounded-full" />
              <div>
                <h1 className="text-xl font-bold">ERODE</h1>
                <p className="text-sm font-bold">SENGUNTHAR ENGINEERING COLLEGE</p>
              </div>
            </div>
            {/* Navigation Menu */}
            <ul className="flex flex-wrap gap-4 text-white font-medium">
              <li>
                <button onClick={() => setActiveMenu('home')} className={activeMenu === 'home' ? 'underline' : ''}>
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setActiveMenu('students')} className={activeMenu === 'students' ? 'underline' : ''}>
                  Students
                </button>
              </li>
              <li>
                <button onClick={() => setActiveMenu('send')} className={activeMenu === 'send' ? 'underline' : ''}>
                  Send
                </button>
              </li>
              <li>
                <button onClick={() => setActiveMenu('subjectMarks')} className={activeMenu === 'subjectMarks' ? 'underline' : ''}>
                  Subject & Marks
                </button>
              </li>
              <li>
                <button onClick={handleLogout} className="hover:text-yellow-200 transition-colors">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-grow container mx-auto p-4 md:p-6">
          {/* Home Section */}
          {activeMenu === 'home' && (
            <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 bg-blue-100 rounded-lg shadow-lg space-y-6 md:space-y-0 md:space-x-6">
              <div className="w-full md:w-1/2 flex justify-center">
                <img
                  src={require('../assets/man1.png')}
                  alt="Admin Dashboard"
                  className="w-full max-w-xs md:max-w-sm h-auto rounded-lg shadow-md object-cover"
                />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h2 className="text-2xl md:text-4xl font-bold text-gray-800 font-caprasimo">
                  Welcome, {advisorDetails.name}!
                </h2>
                <p className="mt-2 text-base md:text-lg text-gray-700">
                  Department - {advisorDetails.department}
                </p>
                <p className="mt-1 text-base md:text-lg text-gray-700">
                  Year - {advisorDetails.year}, Semester - {advisorDetails.semester}
                </p>
                <p className="mt-4 italic text-base md:text-lg text-gray-700 font-caprasimo">
                  "Education is the most powerful weapon which you can use to change the world."
                  <br />
                  <span className="font-semibold">– Nelson Mandela</span>
                </p>
              </div>
            </div>
          )}
          {/* Students Section */}
          {activeMenu === 'students' && (
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Students</h2>
              {selectedStudent ? (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Panel */}
                  <div className="w-full md:w-1/4 md:h-[80vh] md:overflow-y-auto bg-white rounded-lg shadow-lg p-4 md:p-6">
                    <h2 className="text-xl font-bold mb-4">Students</h2>
                    <div className="grid grid-cols-1 gap-4">
                      {students.length > 0 ? (
                        students.map((student) => (
                          <div
                            key={student.rollno}
                            className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-shadow"
                            onClick={() => handleStudentClick(student)}
                          >
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-600">Roll No: {student.rollno}</p>
                          </div>
                        ))
                      ) : (
                        <p>No students found.</p>
                      )}
                    </div>
                  </div>
                  {/* Right Panel */}
                  <div className="w-full md:w-3/4 bg-white rounded-lg shadow-lg p-4 md:p-6">
                    <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                    <table className="min-w-full mt-2 border-collapse border border-gray-300">
                      <tbody>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">Roll No</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.rollno}</td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">Department</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.department}</td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">Year</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.year}</td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">Class</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.class}</td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">Email</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.email}</td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">WhatsApp</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.whatsapp}</td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">Language</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.language}</td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-300 px-3 py-2 font-semibold">Semester</td>
                          <td className="border border-gray-300 px-3 py-2">{selectedStudent.semester}</td>
                        </tr>
                      </tbody>
                    </table>
                    {/* Render Subjects List/Table */}
                    {renderSubjectsList()}
                    {/* Render Marks Table */}
                    {renderMarksTable()}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <div
                        key={student.rollno}
                        className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-shadow"
                        onClick={() => handleStudentClick(student)}
                      >
                        <h3 className="text-lg font-semibold">{student.name}</h3>
                        <p className="text-sm text-gray-600">Roll No: {student.rollno}</p>
                      </div>
                    ))
                  ) : (
                    <p>No students found.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Send Section */}
          {activeMenu === 'send' && (
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Send Marks</h2>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <button
                  onClick={handleSelectAll}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={() => {
                    if (selectedStudentsForMarks.length === 0) {
                      alert('Please select at least one student.');
                      return;
                    }
                    setShowExamModal(true);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Send Selected Marks
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {students.map((student) => (
                  <div
                    key={student.rollno}
                    className="border border-gray-300 rounded-lg p-4 hover:bg-blue-50 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{student.name}</h3>
                      <p className="text-sm text-gray-600">Roll No: {student.rollno}</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudentsForMarks.some((s) => s.rollno === student.rollno)}
                        onChange={() => handleCheckboxChange(student)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Subject & Marks Section */}
          {activeMenu === 'subjectMarks' && (
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold">Subject & Marks</h2>
                <button
                  onClick={openSubjectModal}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Subjects
                </button>
              </div>
              {/* Display Configured Subjects in Subject & Marks Tab */}
              {renderSubjectsList()}

              <table className="min-w-full border-collapse border border-gray-300 mt-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">Exams</th>
                    <th className="border border-gray-300 px-4 py-2">Upload Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {['CAT1', 'CAT2', 'CAT3', 'MODEL'].map((exam, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 px-4 py-2">{exam}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => handleUploadClick(exam)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Upload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
        {/* Modals go here */}
        {/* Subject Modal */}
        {showSubjectModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add Subjects</h3>
                <button
                  onClick={() => setShowSubjectModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <label className="block mb-2">Enter Number of Subjects:</label>
              <input
                type="number"
                min="1"
                value={numSubjects}
                onChange={handleNumSubjectsChange}
                className="w-full p-2 border border-gray-300 rounded mb-4"
                placeholder="e.g., 2"
              />
              <button
                onClick={generateSubjectInputs}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
              >
                Generate Inputs
              </button>
              {subjects.length > 0 && (
                <div className="mt-4 space-y-3">
                  {subjects.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Subject Code"
                        value={subjects[index].code}
                        onChange={(e) => handleSubjectChange(index, 'code', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={subjects[index].name}
                        onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleUpdateSubjects}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
                  >
                    Update
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Exam Type Selection Modal */}
        {showExamModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h3 className="text-lg font-bold mb-4">Select Exam Type</h3>
              {['CAT1', 'CAT2', 'CAT3', 'MODEL'].map((type) => (
                <label key={type} className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="examType"
                    value={type}
                    checked={selectedExamType === type}
                    onChange={(e) => setSelectedExamType(e.target.value)}
                    className="mr-2"
                  />
                  {type}
                </label>
              ))}
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedExamType) {
                      alert('Please select an exam type.');
                      return;
                    }
                    setShowExamModal(false);
                    handleBulkSendMarksWithType(selectedExamType);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
        {/* File Upload Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-auto relative">
              {/* Loader Overlay */}
              {uploadLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-lg z-10">
                  <ClipLoader color={"#292969"} loading={uploadLoading} size={50} />
                  <p className="mt-2 text-gray-700 font-medium">Uploading...</p>
                </div>
              )}

              {/* Success Message Overlay */}
              {uploadSuccess && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-lg z-10 p-4">
                  <div className="text-green-500 mb-4">
                    {/* Checkmark SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 text-center mb-4">{uploadSuccessMessage}</p>
                  <button
                    onClick={closeModal} // Use the closeModal function
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Close
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Upload {uploadExamType} Marks</h3>
                <button
                 // Disable close button during loading or if success is shown
                  onClick={closeModal}
                  disabled={uploadLoading || uploadSuccess}
                  className={`text-gray-500 hover:text-gray-700 focus:outline-none ${(uploadLoading || uploadSuccess) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleUploadSubmit(); }}>
                <label className="block mb-2">Select File:</label>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  // Disable input during loading or if success is shown
                  disabled={uploadLoading || uploadSuccess}
                  className={`w-full p-2 border border-gray-300 rounded mb-4 ${(uploadLoading || uploadSuccess) ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                <button
                  type="submit"
                  // Disable submit if loading, no file, or success is shown
                  disabled={uploadLoading || uploadSuccess || !file}
                  className={`w-full px-4 py-2 rounded flex items-center justify-center ${
                    (uploadLoading || uploadSuccess || !file)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                   {uploadLoading ? (
                      <>
                        <ClipLoader color={"#ffffff"} loading={uploadLoading} size={20} />
                        <span className="ml-2">Uploading...</span>
                      </>
                    ) : (
                      'Upload'
                    )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Footer - Only show if not on Home */}
      {activeMenu !== 'home' && (
        <footer className="bg-[#292969] text-white py-4 text-center mt-auto">
          <p className="text-sm">
            © Copyright Reserved to Erode Sengunthar Engineering College
          </p>
          <p className="text-xs mt-1">
            Developed By Ajay M - B.Tech
          </p>
        </footer>
      )}
    </>
  );
};

export default AdvisorPage;