import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SidebarToggle from "./SidebarToggle";
import {
  faSave,
  faEye,
  faEyeSlash,
  faUser,
  faEnvelope,
  faGlobe,
  faCity,
  faMapMarkerAlt,
  faBarcode,
  faUsers,
  faBriefcase,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useApi } from "../../context/ApiContext";
import AdminNavbar from "../../layouts/AdminNavbar";

const ExecutiveCredentialsForm = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("adminSidebarExpanded") === "false"
  );
  const { createExecutive,createAdmin,createTeamLead } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    country: "",
    city: "",
    state: "",
    postal_code: "",
    tax_id: "",
    // team_id: "",
    profile_picture: null,
    role: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onloadend = () => {
    setFormData((prev) => ({
  ...prev,
  profile_picture: file, // original File object
}));
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file); // Converts to base64
  } else {
    alert("Please upload a valid image file.");
  }
};

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        formPayload.append(key, value);
      }
    });

    // Optional: Debug payload
    for (let pair of formPayload.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    // 👇 Role-based API call
    const role = formData.role.trim();
    switch (role) {
      case "Executive":
        await createExecutive(formPayload);
        break;
      case "TL":
        await createTeamLead(formPayload);
        break;
      case "Admin":
        await createAdmin(formPayload);
        break;
      default:
        throw new Error("Invalid role selected.");
    }

    alert(`${formData.role} created successfully!`);
    setFormSubmitted(true);
  } catch (err) {
    console.error(`Failed to create ${formData.role}:`, err.message || err);
    alert(`Error creating ${formData.role}: ${err.message || "Unknown error"}`);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className={`create-executive-container ${sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
            <AdminNavbar/>
            <div className="create-executive-content-area">
      <SidebarToggle />
      <div className="executive-form-container">
        <div className="form-card">
          <div className="form-header">
            <h1>Create User Credentials</h1>
            <p>Add a new user to your CRM with appropriate access permissions</p>
          </div>

          {formSubmitted ? (
            <div className="success-message">
              <h2>{formData.role} Account Created!</h2>
              <p>
                Credentials have been created successfully and a welcome email has been sent to{" "}
                {formData.email}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-section profile-section">
                  <h2>User Information</h2>

                  <div className="profile-upload">
                    {/* <div className="form-profile-image">
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" />
                      ) : (
                        <div className="profile-placeholder">
                          <FontAwesomeIcon icon={faUser} size="2x" />
                        </div>
                      )}
                    </div> */}
                    {/* <div className="upload-controls">
                      <h3>Profile Photo</h3>
                      <p>Upload a professional profile photo (optional)</p>
                      <label className="upload-button" htmlFor="profile_picture">Upload Image</label>
                      <input
                        type="file"
                        id="profile_picture"
                        name="profile_picture"
                        onChange={handleImageChange}
                        accept="image/*"
                        hidden
                      />
                    </div> */}
                  </div>

                  <div className="form-grid">
  <div className="left-column">
    <div className="form-group">
      <label htmlFor="username">Username</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faUser} className="input-icon" />
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Enter Username"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="firstname">First Name</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faUser} className="input-icon" />
        <input
          type="text"
          id="firstname"
          name="firstname"
          placeholder="Enter First Name"
          value={formData.firstname}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="country">Country</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faGlobe} className="input-icon" />
        <input
          type="text"
          id="country"
          name="country"
          placeholder="Enter Country"
          value={formData.country}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="state">State</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="input-icon" />
        <input
          type="text"
          id="state"
          name="state"
          placeholder="Enter State"
          value={formData.state}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="team_id">Team ID</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faUsers} className="input-icon" />
        <input
          type="text"
          // id="team_id"
          // name="team_id"
          placeholder="Enter Team ID"
          // value={formData.team_id}
          onChange={handleInputChange}
        />
      </div>
    </div>
  </div>

  <div className="right-column">
    <div className="form-group">
      <label htmlFor="email">Email</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter Email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="lastname">Last Name</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faUser} className="input-icon" />
        <input
          type="text"
          id="lastname"
          name="lastname"
          placeholder="Enter Last Name"
          value={formData.lastname}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="city">City</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faCity} className="input-icon" />
        <input
          type="text"
          id="city"
          name="city"
          placeholder="Enter City"
          value={formData.city}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor="postal_code">Postal Code</label>
      <div className="input-with-icon">
        <FontAwesomeIcon icon={faBarcode} className="input-icon" />
        <input
          type="text"
          id="postal_code"
          name="postal_code"
          placeholder="Enter Postal Code"
          value={formData.postal_code}
          onChange={handleInputChange}
        />
      </div>
    </div>
<div className="form-group">
  <label htmlFor="role">Role</label>
  <div className="input-with-icon">
    <FontAwesomeIcon icon={faBriefcase} className="input-icon" />
 <select
  id="role"
  name="role"
  value={formData.role}
  onChange={handleInputChange}
  required
>
  <option value="" disabled>
     Select Role 
  </option>
  <option value="Executive">Executive</option>
  <option value="TL">Team Lead</option>
  <option value="Admin">Admin</option>
</select>

  </div>
</div>
  </div>

  <div className="form-group" style={{ gridColumn: "span 2" }}>
    <label htmlFor="password">Password</label>
    <div className="input-with-icon password-input">
      <FontAwesomeIcon icon={faLock} className="input-icon" />
      <input
        type={showPassword ? "text" : "password"}
        id="password"
        name="password"
        placeholder="Enter Password"
        value={formData.password}
        onChange={handleInputChange}
        required
      />
      <button type="button" onClick={togglePasswordVisibility} className="password-toggle">
        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
      </button>
    </div>
  </div>
</div>

                </div>
              </div>

              <div className="form-actions">
               
                <button
                  type="submit"
                  className={`submit-button ${isLoading ? "loading" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      Create User Account
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default ExecutiveCredentialsForm;