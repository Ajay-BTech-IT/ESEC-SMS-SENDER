import React, { useState, useEffect } from 'react';

const UpdateMenu = ({ selectedOption }) => {
  const role = selectedOption.replace('update-', '');

  // Role-based configuration
  const roleConfig = {
    student: {
      idField: 'rollno',
      idLabel: 'Roll Number',
      filterFields: ['year', 'department', 'class', 'language'],
      apiEndpoints: {
        getById: '/api/admin/get-student/',
        filter: '/api/admin/filter-students',
        updateAll: '/api/admin/update-all-students',
        updateSingle: '/api/admin/update-student'
      }
    },
    advisor: {
      idField: 'advisorid',
      idLabel: 'Advisor ID',
      filterFields: ['year', 'department', 'class'],
      apiEndpoints: {
        getById: '/api/admin/get-advisor/',
        filter: '/api/admin/filter-advisors',
        updateAll: '/api/admin/update-all-advisors',
        updateSingle: '/api/admin/update-advisor'
      }
    },
    admin: {
      idField: 'username',
      idLabel: 'Username',
      filterFields: ['year', 'department'],
      apiEndpoints: {
        getById: '/api/admin/get-admin/',
        filter: '/api/admin/filter-admins',
        updateAll: '/api/admin/update-all-admins',
        updateSingle: '/api/admin/update-admin'
      }
    }
  };

  const config = roleConfig[role] || roleConfig.student;

  // State
  const [id, setId] = useState('');
  const [filters, setFilters] = useState({
    year: '',
    department: '',
    class: '',
    language: ''
  });
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [editedData, setEditedData] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  // Reset states when role changes
  useEffect(() => {
    setId('');
    setFilters({
      year: '',
      department: '',
      class: '',
      language: ''
    });
    setData(null);
    setFilteredData([]);
    setEditedData([]);
    setIsEditMode(false);
    setIsFilterVisible(true);
  }, [role]);

  // Handle ID input change
  const handleIdChange = (e) => setId(e.target.value);

  // Handle filter inputs
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Fetch by ID
  const fetchDataById = async () => {
    try {
      let fetchId = id.trim();
      if (config.idField !== 'advisorid' && config.idField !== 'username') {
        fetchId = fetchId.toUpperCase(); // skip for advisorid/username
      }

      const response = await fetch(`http://localhost:5000${config.apiEndpoints.getById}${fetchId}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
        setFilteredData([]);
      } else {
        alert(`Error: ${result.message || `Failed to fetch ${role}`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Fetch by Filters
  const fetchDataByFilters = async () => {
    const lowerCaseFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      lowerCaseFilters[key] = value ? value.trim().toLowerCase() : '';
    });

    const queryParams = new URLSearchParams(lowerCaseFilters).toString();

    try {
      const response = await fetch(`http://localhost:5000${config.apiEndpoints.filter}?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setFilteredData(result);
        setData(null);
        setEditedData(result.map((item) => ({ ...item })));
        setIsFilterVisible(false);
      } else {
        alert(`Error: ${result.message || `Failed to fetch ${role}s`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Edit cell handler
  const handleEditChange = (index, key, value) => {
    const updated = [...editedData];
    updated[index][key] = value;
    setEditedData(updated);
  };

  // Save all edits
 // Save all edits
const handleUpdateAll = async () => {
  try {
    const payloadKey = role === 'advisor' ? 'advisors' : role === 'admin' ? 'admins' : 'students';

    const response = await fetch(`http://localhost:5000${config.apiEndpoints.updateAll}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [payloadKey]: editedData }),
    });
      const result = await response.json();

      if (response.ok) {
        alert(`✅ All ${role}s updated successfully!`);
        setFilteredData([...editedData]);
        setIsEditMode(false);
      } else {
        alert(`❌ Error: ${result.message || `Failed to update ${role}s`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Save single edit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!data || !data[config.idField]) {
      alert(`${config.idLabel} is required to update.`);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000${config.apiEndpoints.updateSingle}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${role.charAt(0).toUpperCase() + role.slice(1)} updated successfully!`);
        setData(null);
      } else {
        alert(`❌ Error: ${result.message || `Failed to update ${role}`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Render Filter Fields based on role
  const renderFilterFields = () => (
    <>
      {config.filterFields.includes('year') && (
        <input
          type="text"
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          placeholder="Year"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      )}
      {config.filterFields.includes('department') && (
        <input
          type="text"
          name="department"
          value={filters.department}
          onChange={handleFilterChange}
          placeholder="Department"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      )}
      {config.filterFields.includes('class') && (
        <input
          type="text"
          name="class"
          value={filters.class}
          onChange={handleFilterChange}
          placeholder="Class"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      )}
      {config.filterFields.includes('language') && (
        <input
          type="text"
          name="language"
          value={filters.language}
          onChange={handleFilterChange}
          placeholder="Language"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-blue-100 relative overflow-hidden rounded-lg font-poppins">
      {/* Mobile Toggle Button */}
      {!isFilterVisible && (
        <button
          onClick={() => setIsFilterVisible(true)}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-full shadow-lg z-20"
        >
          &#x2190; {/* Left Arrow */}
        </button>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-col md:flex-row w-full h-full p-6 space-y-4 md:space-y-0 md:space-x-6 justify-center items-center">
        {/* Left Side: Filter Section */}
        {(isFilterVisible || !filteredData.length) && (
          <div
            className={`w-full md:w-1/4 h-full p-6 bg-gray-100 rounded-lg shadow-lg mx-auto md:mx-0 md:m-8 z-10 order-2 md:order-1 mt-5 md:mt-0 ${
              !isFilterVisible ? 'hidden md:block' : ''
            }`}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Search {role.charAt(0).toUpperCase() + role.slice(1)}</h2>

            {/* Fetch by ID */}
            <div className="mb-4">
              <label htmlFor={config.idField} className="block text-sm font-medium text-gray-700">
                {config.idLabel}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  id={config.idField}
                  value={id}
                  onChange={handleIdChange}
                  placeholder={`Enter ${config.idLabel}`}
                  className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <button
                  onClick={fetchDataById}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Check
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Advanced Filters</h3>
              <div className="space-y-2">{renderFilterFields()}</div>
              <button
                onClick={fetchDataByFilters}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {/* Right Side: Results Section */}
        <div
          className={`w-full md:w-3/4 h-full p-6 bg-gray-100 rounded-lg shadow-lg mx-auto md:mx-0 md:m-8 z-10 overflow-y-auto order-1 md:order-2 ${
            !isFilterVisible ? 'w-full md:w-3/4' : ''
          }`}
        >
          {/* Placeholder Quote When No Data */}
          {!data && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ready to Update?</h2>
              <p className="text-lg text-gray-600 italic mb-4">
                "The best way to predict your future is to create it." <br />
                <span className="font-semibold">– Abraham Lincoln</span>
              </p>
              <img
                src={require('../assets/man2.png')}
                alt="Background Paint"
                className="w-[200px] h-[300px] object-cover opacity-80"
              />
            </div>
          )}

          {/* Single Item Form */}
          {data && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Update {role.charAt(0).toUpperCase() + role.slice(1)}
              </h2>
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                {Object.keys(data).map((key) => (
                  <input
                    key={key}
                    type="text"
                    name={key}
                    value={data[key]}
                    onChange={(e) =>
                      setData({ ...data, [key]: e.target.value })
                    }
                    placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                    className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                ))}
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 w-full"
                >
                  Update
                </button>
              </form>
            </div>
          )}

          {/* Table View */}
          {filteredData.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Filtered {role.charAt(0).toUpperCase() + role.slice(1)}s
                </h2>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-lg ${
                    isEditMode ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {isEditMode ? 'Cancel Edit' : 'Edit'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      {Object.keys(filteredData[0]).map((key) => (
                        <th
                          key={key}
                          className="py-2 px-4 text-left text-sm font-semibold text-gray-700 bg-gray-100 border-b border-gray-200"
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editedData.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {Object.keys(item).map((key) => (
                          <td
                            key={key}
                            className="py-2 px-4 text-sm text-gray-700 border-b border-gray-200"
                          >
                            {isEditMode ? (
                              <input
                                type="text"
                                value={item[key]}
                                onChange={(e) => handleEditChange(index, key, e.target.value)}
                                className="p-2 border rounded w-full"
                              />
                            ) : (
                              item[key]
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isEditMode && (
                <button
                  onClick={handleUpdateAll}
                  className="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 w-full md:w-1/2 mx-auto block"
                >
                  Update All
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateMenu;