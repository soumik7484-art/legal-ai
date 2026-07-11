import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "../api/axios";
import "../styles/LegalTech.css";

const LegalTech = () => {
  const navigate = useNavigate();
  const { isLoggedin, userData, setIsLoggedin, setUserData } = useContext(AppContext);

  // States
  const [contractsList, setContractsList] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showUpload, setShowUpload] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "bot",
      content:
        "Hello! Upload a contract or select one from the sidebar, then ask me questions like:\n• What are the termination clauses?\n• Who owns the intellectual property?\n• What are the payment milestones?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isFetchingContracts, setIsFetchingContracts] = useState(false);

  // Refs
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedin) {
      navigate("/login");
    }
  }, [isLoggedin, navigate]);

  // Fetch all user contracts
  const fetchContracts = useCallback(async () => {
    setIsFetchingContracts(true);
    try {
      const { data } = await axios.get("/api/contracts");
      if (data.success) {
        setContractsList(data.contracts);
      }
    } catch (err) {
      console.error("Failed to fetch contracts:", err);
      toast.error("Failed to load your documents library.");
    } finally {
      setIsFetchingContracts(false);
    }
  }, []);

  // Fetch contracts on mount when logged in
  useEffect(() => {
    if (isLoggedin) {
      fetchContracts();
    }
  }, [isLoggedin, fetchContracts]);

  // Theme Toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "light" : "dark"
    );
  };

  // Logout
  const handleLogout = async () => {
    try {
      const { data } = await axios.post("/api/auth/logout");
      if (data.success) {
        setIsLoggedin(false);
        setUserData(false);
        navigate("/login");
        toast.success("Logged out successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Logout failed");
    }
  };

  // Fetch specific contract details
  const handleSelectContract = async (contractId) => {
    try {
      const { data } = await axios.get(`/api/contracts/${contractId}`);
      if (data.success && data.contract) {
        const contract = data.contract;
        setSelectedContractId(contract._id);
        setCurrentDocumentId(contract._id);
        setFileName(contract.fileName);
        setAnalysisData(contract.analysis);
        setChatMessages(contract.chatHistory || []);
        setShowUpload(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contract details");
    }
  };

  // Delete contract
  const handleDeleteContract = async (e, contractId) => {
    e.stopPropagation(); // Stop selecting the contract
    if (!window.confirm("Are you sure you want to delete this contract?")) return;

    try {
      const { data } = await axios.delete(`/api/contracts/${contractId}`);
      if (data.success) {
        toast.success("Document deleted");
        if (selectedContractId === contractId) {
          goBack();
        }
        fetchContracts();
      }
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  // File handling
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add("dragover");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = async (file) => {
    if (isAnalyzing) return;

    const allowed = /\.(pdf|docx|jpg|jpeg|png)$/i;
    if (!allowed.test(file.name)) {
      toast.error(
        "Unsupported file type. Please upload PDF, DOCX, JPG, JPEG, or PNG."
      );
      return;
    }

    setIsAnalyzing(true);
    setFileName(file.name);

    try {
      toast.info("Uploading and extracting text...");
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post("/api/contracts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (data.success) {
        setSelectedContractId(data.contractId);
        setCurrentDocumentId(data.contractId);
        setAnalysisData(data.analysis);
        setChatMessages(data.chatHistory || []);
        setShowUpload(false);
        toast.success("Contract analyzed successfully!");
        fetchContracts(); // refresh sidebar
      } else {
        throw new Error(data.message || "Analysis failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Something went wrong during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Chat Functions
  const sendChat = async () => {
    const question = chatInput.trim();
    if (!question || !currentDocumentId) {
      if (!currentDocumentId) toast.error("Please upload or select a contract first");
      return;
    }

    setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: question }];
    setChatMessages(newMessages);

    try {
      const { data } = await axios.post(`/api/contracts/${currentDocumentId}/chat`, {
        question
      });

      if (data.success) {
        setChatMessages(data.chatHistory);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to get response");
      setChatMessages([
        ...newMessages,
        {
          role: "bot",
          content: "⚠️ " + (err.response?.data?.message || err.message || "Something went wrong"),
        },
      ]);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Back to upload screen
  const goBack = () => {
    setShowUpload(true);
    setSelectedContractId(null);
    setCurrentDocumentId(null);
    setFileName("");
    setAnalysisData(null);
    setChatMessages([
      {
        role: "bot",
        content:
          "Hello! Upload a contract or select one from the sidebar, then ask me questions like:\n• What are the termination clauses?\n• Who owns the intellectual property?\n• What are the payment milestones?",
      },
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="legal-tech-container"
      data-theme={isDarkMode ? "dark" : "light"}
    >
      {/* Navbar */}
      <nav className="legal-navbar">
        <div className="navbar-content">
          <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            <i className="fas fa-balance-scale"></i>
            <span>LegalAssist</span>
          </div>
          <div className="navbar-actions">
            <span className="user-badge">
              <i className="fas fa-user-tie"></i> {userData?.username || "Legal Counsel"}
            </span>
            <button className="theme-btn" onClick={toggleTheme} title="Toggle Theme">
              <i className={`fas fa-${isDarkMode ? "sun" : "moon"}`}></i>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="legal-app-body">
        {/* Sidebar */}
        <aside className="legal-sidebar-panel">
          <div className="sidebar-header">
            <h4>Documents Library</h4>
            <button className="new-doc-btn" onClick={goBack} title="New Document">
              <i className="fas fa-plus"></i> Analyze New
            </button>
          </div>

          <div className="sidebar-list-container">
            {isFetchingContracts ? (
              <div className="sidebar-loader">
                <span className="mini-spinner"></span> Loading Library...
              </div>
            ) : contractsList.length === 0 ? (
              <div className="empty-sidebar-message">
                <i className="fas fa-folder-open"></i>
                <p>No documents analyzed yet.</p>
              </div>
            ) : (
              contractsList.map((contract) => {
                const isSelected = selectedContractId === contract._id;
                const riskVal = contract.analysis?.risk_score || 0;
                let riskClass = "low";
                if (riskVal >= 7) riskClass = "high";
                else if (riskVal >= 4) riskClass = "medium";

                return (
                  <div
                    key={contract._id}
                    className={`sidebar-contract-card ${isSelected ? "active" : ""}`}
                    onClick={() => handleSelectContract(contract._id)}
                  >
                    <div className="sidebar-card-content">
                      <div className="card-top">
                        <i className="fas fa-file-contract contract-file-icon"></i>
                        <span className="contract-name" title={contract.fileName}>
                          {contract.fileName}
                        </span>
                      </div>
                      <div className="card-bottom">
                        <span className="contract-type-badge">
                          {contract.analysis?.contract_type || "Contract"}
                        </span>
                        <span className={`contract-risk-badge risk-${riskClass}`}>
                          Risk: {riskVal}/10
                        </span>
                      </div>
                    </div>
                    <button
                      className="delete-contract-btn"
                      onClick={(e) => handleDeleteContract(e, contract._id)}
                      title="Delete document"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Panel Content */}
        <main className="legal-main-content">
          {showUpload ? (
            <section className="upload-section">
              <div className="hero-content">
                <div className="hero-left">
                  <span className="badge-ai">Enterprise Legal Intelligence</span>
                  <h1 className="hero-title">
                    Analyze Agreements <span>instantly.</span>
                  </h1>
                  <p className="hero-text">
                    Securely upload contracts to extract legal clauses, assess potential liabilities, reveal hidden deadlines, and chat with a specialized legal analysis framework.
                  </p>
                  <div className="feature-pills">
                    <div className="pill">
                      <i className="fas fa-shield-alt"></i> Risk Assessments
                    </div>
                    <div className="pill">
                      <i className="fas fa-file-invoice"></i> Key Obligations
                    </div>
                    <div className="pill">
                      <i className="fas fa-clock"></i> Timeline Milestones
                    </div>
                  </div>
                </div>

                <div className="hero-right">
                  <div className="upload-card">
                    <div className="upload-header">
                      <div className="upload-icon">
                        <i className="fas fa-upload"></i>
                      </div>
                      <h3>Analyze Document</h3>
                      <p>PDF, DOCX, PNG, or JPG (Max 10MB)</p>
                    </div>

                    <div
                      className="drop-zone"
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInput}
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                        style={{ display: "none" }}
                      />
                      <div className="drop-content">
                        <i className="fas fa-file-upload"></i>
                        <h5>Drag & drop file here</h5>
                        <p>or click to browse local folders</p>
                      </div>
                    </div>

                    <button
                      className={`analyze-btn ${isAnalyzing ? "loading" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="spinner"></span>
                          Reviewing Text...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-gavel"></i>
                          Begin Contract Audit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            /* Dashboard Section */
            <section className="dashboard-section">
              <div className="dashboard-header">
                <div className="title-area">
                  <i className="fas fa-file-alt title-icon"></i>
                  <div>
                    <h2>{analysisData?.contract_type || "Contract Analysis"}</h2>
                    <p className="file-name">{fileName}</p>
                  </div>
                </div>
                <button className="back-btn" onClick={goBack}>
                  <i className="fas fa-arrow-left"></i> Back to Upload
                </button>
              </div>

              <div className="dashboard-grid">
                {/* Left Column */}
                <div className="dashboard-left">
                  {/* Stats */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="risk-pie-container">
                        <svg width="44" height="44" viewBox="0 0 36 36" className="risk-pie-svg">
                          {/* Green background circle (representing the safe portion) */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="4"
                          />
                          {/* Red overlay circle (representing the risk portion) */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="4"
                            strokeDasharray={`${(analysisData?.risk_score || 0) * 10} 100`}
                            transform="rotate(-90 18 18)"
                            className="risk-pie-slice"
                          />
                        </svg>
                        <span className="risk-pie-score">{analysisData?.risk_score || "0"}</span>
                      </div>
                      <div>
                        <p>Risk Score</p>
                        <h3>{analysisData?.risk_score || "0"}/10</h3>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon warning">
                        <i className="fas fa-shield-alt"></i>
                      </div>
                      <div>
                        <p>Risk Clauses</p>
                        <h3>{(analysisData?.risky_clauses || []).length}</h3>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon info">
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                      <div>
                        <p>Deadlines</p>
                        <h3>{(analysisData?.deadlines || []).length}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="glass-card">
                    <h4 className="section-title">
                      <i className="fas fa-align-left"></i>
                      Executive Summary
                    </h4>
                    <p className="summary-text">
                      {analysisData?.summary || "No summary available."}
                    </p>
                  </div>

                  {/* Contract Type & Parties */}
                  <div className="glass-card">
                    <h4 className="section-title">
                      <i className="fas fa-info-circle"></i>
                      Document Metadata
                    </h4>
                    <div className="detail-item">
                      <strong>Document Classification:</strong>{" "}
                      {analysisData?.contract_type || "Unknown"}
                    </div>
                    <div className="detail-item">
                      <strong>Identified Parties:</strong>
                      {analysisData?.parties &&
                      analysisData.parties.length > 0 ? (
                        <ul className="parties-list">
                          {analysisData.parties.map((party, i) => (
                            <li key={i}>
                              <i className="fas fa-user-circle"></i> {party}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span> Not identified</span>
                      )}
                    </div>
                  </div>

                  {/* Risk Analysis */}
                  {analysisData?.risky_clauses &&
                    analysisData.risky_clauses.length > 0 && (
                      <div className="glass-card">
                        <h4 className="section-title">
                          <i className="fas fa-shield-virus"></i>
                          Identified Risks & Liabilities
                        </h4>
                        <div className="risks-list">
                          {analysisData.risky_clauses.map((clause, i) => {
                            const sev = (clause.severity || "high").toLowerCase();
                            return (
                              <div key={i} className={`risk-item severity-${sev}`}>
                                <div className="risk-item-header">
                                  <h6>{clause.title || `Risk Point ${i + 1}`}</h6>
                                  <span className={`risk-badge ${sev}`}>
                                    {clause.severity || "High"}
                                  </span>
                                </div>
                                <p className="risk-reason">{clause.reason}</p>
                                {clause.clause && (
                                  <blockquote className="risk-quote">
                                    "{clause.clause}"
                                  </blockquote>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Key Obligations */}
                  {analysisData?.key_obligations &&
                    analysisData.key_obligations.length > 0 && (
                      <div className="glass-card">
                        <h4 className="section-title">
                          <i className="fas fa-tasks"></i>
                          Key Obligations & Deliverables
                        </h4>
                        <ul className="bullet-list">
                          {analysisData.key_obligations.map((obligation, i) => (
                            <li key={i}>
                              <i className="fas fa-arrow-right list-bullet"></i>
                              <span>{obligation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Deadlines */}
                  {analysisData?.deadlines &&
                    analysisData.deadlines.length > 0 && (
                      <div className="glass-card">
                        <h4 className="section-title">
                          <i className="fas fa-hourglass-end"></i>
                          Critical Timelines & Deadlines
                        </h4>
                        <ul className="bullet-list">
                          {analysisData.deadlines.map((deadline, i) => (
                            <li key={i}>
                              <i className="fas fa-clock list-bullet"></i>
                              <span>{deadline}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Missing Protections */}
                  {analysisData?.missing_protections &&
                    analysisData.missing_protections.length > 0 && (
                      <div className="glass-card">
                        <h4 className="section-title">
                          <i className="fas fa-puzzle-piece"></i>
                          Missing Protections & Vulnerabilities
                        </h4>
                        <ul className="bullet-list">
                          {analysisData.missing_protections.map((protection, i) => (
                            <li key={i}>
                              <i className="fas fa-exclamation-circle list-bullet warning-bullet"></i>
                              <span>{protection}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Favorable Clauses */}
                  {analysisData?.favorable_clauses &&
                    analysisData.favorable_clauses.length > 0 && (
                      <div className="glass-card">
                        <h4 className="section-title">
                          <i className="fas fa-thumbs-up"></i>
                          Favorable Clauses & Strengths
                        </h4>
                        <ul className="bullet-list">
                          {analysisData.favorable_clauses.map((clause, i) => (
                            <li key={i}>
                              <i className="fas fa-check-circle list-bullet success-bullet"></i>
                              <span>{clause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Recommendations */}
                  {analysisData?.recommendations &&
                    analysisData.recommendations.length > 0 && (
                      <div className="glass-card">
                        <h4 className="section-title">
                          <i className="fas fa-lightbulb"></i>
                          Strategic Recommendations
                        </h4>
                        <div className="recommendations-list">
                          {analysisData.recommendations.map((rec, i) => (
                            <div key={i} className="suggestion-item">
                              <i className="fas fa-hand-pointing-right"></i>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Right Column - Chat */}
                <div className="dashboard-right">
                  <div className="chat-card">
                    <div className="chat-header">
                      <div className="chat-header-title">
                        <i className="fas fa-comments"></i>
                        <h4>Document Consultation</h4>
                      </div>
                      <p>Query details, definitions, and contract clauses</p>
                    </div>

                    <div className="chat-messages" ref={chatMessagesRef}>
                      {chatMessages.map((msg, i) => {
                        const isUser = msg.role === "user";
                        return (
                          <div key={i} className={`chat-message ${isUser ? "user" : "bot"}`}>
                            <div className="chat-bubble">
                              {msg.content.split("\n").map((line, j) => (
                                <div key={j} className="chat-line">{line}</div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="chat-input-area">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendChat()}
                        placeholder="Ask a question about this agreement..."
                      />
                      <button onClick={sendChat} className="chat-send" title="Send message">
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default LegalTech;
