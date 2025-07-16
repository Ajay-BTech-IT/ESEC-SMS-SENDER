import React, { useState, useEffect } from 'react';

const RemoveMenu = ({ selectedOption }) => {
  const role = selectedOption.replace('remove-', '');

  // Role-based configuration
  const roleConfig = {
    student: {
      idField: 'rollno',
      idLabel: 'Roll Number',
      filterFields: ['year', 'department', 'class', 'language'],
      apiEndpoints: {
        getById: '/api/admin/get-student/',
        filter: '/api/admin/filter-students',
        removeSingle: '/api/admin/remove-student',
        removeMultiple: '/api/admin/remove-students'
      }
    },
    advisor: {
      idField: 'advisorid',
      idLabel: 'Advisor ID',
      filterFields: ['year', 'department', 'class'],
      apiEndpoints: {
        getById: '/api/admin/get-advisor/',
        filter: '/api/admin/filter-advisors',
        removeSingle: '/api/admin/remove-advisor',
        removeMultiple: '/api/admin/remove-advisors'
      }
    },
    admin: {
      idField: 'username',
      idLabel: 'Username',
      filterFields: ['year', 'department'],
      apiEndpoints: {
        getById: '/api/admin/get-admin/',
        filter: '/api/admin/filter-admins',
        removeSingle: '/api/admin/remove-admin',
        removeMultiple: '/api/admin/remove-admins'
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
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  // Reset state when role changes
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
    setSelectedItems(new Set());
    setIsFilterVisible(true);
  }, [role]);

  // Handle ID input change
  const handleIdChange = (e) => setId(e.target.value);

  // Handle filter inputs
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Toggle checkbox selection
  const handleCheckboxChange = (idField, idValue) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(idValue)) {
      newSelected.delete(idValue);
    } else {
      newSelected.add(idValue);
    }
    setSelectedItems(newSelected);
  };

  // Select/Deselect all
  const handleSelectAll = () => {
    const isChecked = filteredData.every((item) =>
      selectedItems.has(item[config.idField])
    );
    if (isChecked) {
      setSelectedItems(new Set());
    } else {
      const allIds = filteredData.map((item) => item[config.idField]);
      setSelectedItems(new Set(allIds));
    }
  };

  // Fetch data by ID
  const fetchDataById = async () => {
    try {
      let fetchId = id.trim();
      if (
        config.idField !== 'advisorid' &&
        config.idField !== 'username'
      ) {
        fetchId = fetchId.toUpperCase(); // skip for advisorid/username
      }

      const response = await fetch(
        `http://localhost:5000${config.apiEndpoints.getById}${fetchId}`
      );
      const result = await response.json();

      if (response.ok) {
        setData(result);
        setFilteredData([]);
        setSelectedItems(new Set([result[config.idField]]));
      } else {
        alert(`Error: ${result.message || `Failed to fetch ${role}`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Fetch data by filters
  const fetchDataByFilters = async () => {
    const lowerCaseFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      lowerCaseFilters[key] = value ? value.trim().toLowerCase() : '';
    });

    const queryParams = new URLSearchParams(lowerCaseFilters).toString();

    try {
      const response = await fetch(
        `http://localhost:5000${config.apiEndpoints.filter}?${queryParams}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setFilteredData(result);
        setData(null);
        setIsFilterVisible(false);
      } else {
        alert(`Error: ${result.message || `Failed to fetch ${role}s`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Remove selected items
  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) {
      alert('⚠ Please select at least one item to remove.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} selected ${role}(s)?`
    );
    if (!confirmDelete) return;

    const payload = {
      ids: Array.from(selectedItems),
    };

    try {
      const response = await fetch(
        `http://localhost:5000${config.apiEndpoints.removeMultiple}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Removed ${selectedItems.size} ${role}(s) successfully!`);
        setFilteredData(
          filteredData.filter(
            (item) => !selectedItems.has(item[config.idField])
          )
        );
        setSelectedItems(new Set());
      } else {
        alert(`❌ Error: ${result.message || `Failed to remove ${role}`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Remove single item
  const handleRemoveSingle = async (idValue) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this ${role}?`
    );
    if (!confirmDelete) return;

    try {
      const url = `http://localhost:5000${
        config.apiEndpoints.removeSingle
      }/${encodeURIComponent(idValue)}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${role.charAt(0).toUpperCase() + role.slice(1)} removed successfully!`);
        setData(null);
        setFilteredData(
          filteredData.filter((item) => item[config.idField] !== idValue)
        );
      } else {
        alert(`❌ Error: ${result.message || `Failed to remove ${role}`}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('⚠ Something went wrong! Please check your connection.');
    }
  };

  // Render Filter Fields
  const renderFilterFields = () => (
    <>
      {config.filterFields.includes('year') && (
        <input
          type="text"
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          placeholder="Year"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-2"
        />
      )}
      {config.filterFields.includes('department') && (
        <input
          type="text"
          name="department"
          value={filters.department}
          onChange={handleFilterChange}
          placeholder="Department"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-2"
        />
      )}
      {config.filterFields.includes('class') && (
        <input
          type="text"
          name="class"
          value={filters.class}
          onChange={handleFilterChange}
          placeholder="Class"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-2"
        />
      )}
      {config.filterFields.includes('language') && (
        <input
          type="text"
          name="language"
          value={filters.language}
          onChange={handleFilterChange}
          placeholder="Language"
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-2"
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
          ←
        </button>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-col md:flex-row w-full h-full p-6 space-y-4 md:space-y-0 md:space-x-6 justify-center items-start md:items-center mt-16 md:mt-0">
        {/* Left Side: Filter Section */}
        {(isFilterVisible || !filteredData.length) && (
          <div
            className={`w-full md:w-1/4 h-auto p-6 bg-gray-100 rounded-lg shadow-lg mx-auto md:mx-0 md:m-8 z-10 transition-all duration-300`}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Search {role.charAt(0).toUpperCase() + role.slice(1)}
            </h2>

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
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 whitespace-nowrap"
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
          style={{ maxHeight: 'calc(100vh - 100px)', minHeight: '80vh' }}
        >
          {/* Placeholder Quote When No Data */}
          {!data && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ready to Remove?</h2>
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
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Confirm Removal of {role.charAt(0).toUpperCase() + role.slice(1)}
              </h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {Object.keys(data).map((key) => (
                  <input
                    key={key}
                    type="text"
                    name={key}
                    value={data[key]}
                    readOnly
                    className="p-2 border rounded-lg bg-gray-200 w-full"
                  />
                ))}
                <button
                  onClick={() => handleRemoveSingle(data[config.idField])}
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 w-full"
                >
                  Remove
                </button>
              </form>
            </div>
          )}

          {/* Table View */}
          {filteredData.length > 0 && (
            <div className="overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Filtered {role.charAt(0).toUpperCase() + role.slice(1)}s
                </h2>
                <button
                  onClick={handleRemoveSelected}
                  disabled={selectedItems.size === 0}
                  className={`px-4 py-2 rounded-lg ${
                    selectedItems.size === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  Remove Selected
                </button>
              </div>
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-2 px-4">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedItems.size === filteredData.length &&
                          filteredData.length > 0
                        }
                      />
                    </th>
                    {Object.keys(filteredData[0]).map((key) => (
                      <th key={key} className="py-2 px-4 text-left">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item[config.idField])}
                          onChange={() =>
                            handleCheckboxChange(config.idField, item[config.idField])
                          }
                        />
                      </td>
                      {Object.values(item).map((value, idx) => (
                        <td key={idx} className="py-2 px-4">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveMenu;