import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api/queue";

export default function AdminDashboard() {
  const [currentLoading, setCurrentLoading] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchCurrentLoading = async () => {
    try {
      const res = await fetch(`${API_BASE}/current-loading`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/");
        }
        return;
      }

      if (data.message) {
        setCurrentLoading(null);
        setLoadingMessage(data.message);
      } else {
        setCurrentLoading(data);
        setLoadingMessage("");
      }
    } catch (error) {
      console.error("Error fetching current loading driver:", error);
    }
  };

  const fetchWaitingQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/waiting`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/");
        }
        return;
      }

      setWaitingQueue(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching waiting queue:", error);
    }
  };

  const refreshDashboard = async () => {
    await Promise.all([fetchCurrentLoading(), fetchWaitingQueue()]);
  };

  const handleLoadNext = async () => {
    try {
      setActionLoading(true);

      const res = await fetch(`${API_BASE}/load-next`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json();
      alert(data.message);
      await refreshDashboard();
    } catch (error) {
      console.error("Error loading next driver:", error);
      alert("Failed to load next driver");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (queueId) => {
    try {
      setActionLoading(true);

      const res = await fetch(`${API_BASE}/complete/${queueId}`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json();
      alert(data.message);
      await refreshDashboard();
    } catch (error) {
      console.error("Error completing loading:", error);
      alert("Failed to complete loading");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      refreshDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2>Current Loading</h2>

        {currentLoading ? (
          <div>
            <p style={styles.driverText}>
              {currentLoading.driver_name} — {currentLoading.plate_number}
            </p>
            <p style={styles.subText}>{currentLoading.park_name}</p>

            <button
              style={styles.completeButton}
              onClick={() => handleComplete(currentLoading.queue_id)}
              disabled={actionLoading}>
              COMPLETE
            </button>
          </div>
        ) : (
          <p style={styles.emptyText}>
            {loadingMessage || "No driver currently loading"}
          </p>
        )}
      </div>

      <div style={styles.card}>
        <button
          style={styles.loadButton}
          onClick={handleLoadNext}
          disabled={actionLoading}>
          LOAD NEXT DRIVER
        </button>
      </div>

      <div style={styles.card}>
        <h2>Waiting Queue</h2>

        {waitingQueue.length === 0 ? (
          <p style={styles.emptyText}>No drivers waiting</p>
        ) : (
          <ol style={styles.list}>
            {waitingQueue.map((driver) => (
              <li key={driver.queue_id} style={styles.listItem}>
                {driver.driver_name} — {driver.plate_number}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
  },
  logoutButton: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  driverText: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  subText: {
    color: "#555",
    marginBottom: "12px",
  },
  emptyText: {
    color: "#777",
  },
  loadButton: {
    backgroundColor: "#c60922",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  completeButton: {
    backgroundColor: "green",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  list: {
    paddingLeft: "20px",
  },
  listItem: {
    marginBottom: "10px",
  },
};
