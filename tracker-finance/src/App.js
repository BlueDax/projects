import React, { useState, useEffect } from "react";

const CATEGORIES = [
  "Alimentaire",
  "Transport",
  "Salaires",
  "Logement",
  "Réparations",
  "Divertissement/Loisirs",
  "Autres",
];

// Simple inline styles for brevity
const styles = {
  container: {
    maxWidth: "900px",
    margin: "2rem auto",
    padding: "0 1rem",
    fontFamily: "sans-serif",
  },
  dashboard: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  card: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    flex: 1,
    textAlign: "center",
  },
  tabs: {
    display: "flex",
    borderBottom: "2px solid #ddd",
    marginBottom: "1.5rem",
  },
  tabBtn: {
    padding: "0.75rem 1.5rem",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#666",
  },
  activeTab: {
    color: "#3498db",
    borderBottom: "3px solid #3498db",
    marginBottom: "-2px",
  },
  form: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  input: {
    padding: "0.6rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    flex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
  },
  thTd: { padding: "1rem", textAlign: "left", borderBottom: "1px solid #eee" },
  badge: {
    padding: "0.2rem 0.6rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
};

function App() {
  // Load from LocalStorage on init
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("myFinanceData");
    return saved ? JSON.parse(saved) : [];
  });

  const [type, setType] = useState("expenses"); // 'expenses' or 'income'
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [desc, setDesc] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Save whenever transactions change
  useEffect(() => {
    localStorage.setItem("myFinanceData", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (e) => {
    e.preventDefault();
    if (!amount || !date) return alert("Please fill amount and date");

    const newTx = {
      id: Date.now(),
      type,
      amount: parseFloat(amount),
      category,
      date,
      description: desc,
    };
    setTransactions([...transactions, newTx]);
    setAmount("");
    setDesc("");
  };

  const handleDelete = (id) => {
    // Using a simple prompt or just removing immediately if you want to avoid confirm entirely
    // If you strictly need confirmation, this works:
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  // Calculations
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.inc += t.amount;
      else acc.exp += t.amount;
      return acc;
    },
    { inc: 0, exp: 0 },
  );
  const balance = totals.inc - totals.exp;

  const list = [...transactions] // Create a copy to avoid mutating state
    .filter((t) => t.type === type)
    .filter(
      (t) => selectedCategory === "All" || t.category === selectedCategory,
    )
    .sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      let comparison = 0;

      if (typeof valA === "string") {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === "number") {
        comparison = valA - valB;
      } else if (valA instanceof Date) {
        comparison = new Date(valA) - new Date(valB);
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

  return (
    <div style={styles.container}>
      <h1 align="center">Gestionnaire des dépenses</h1>

      {/* Dashboard */}
      <div style={styles.dashboard}>
        <div style={styles.card}>
          <h3>Revenus</h3>
          <div
            style={{ color: "#2ecc71", fontSize: "1.5rem", fontWeight: "bold" }}
          >
            {totals.inc.toFixed(2)} €
          </div>
        </div>
        <div style={styles.card}>
          <h3>Dépenses</h3>
          <div
            style={{ color: "#e74c3c", fontSize: "1.5rem", fontWeight: "bold" }}
          >
            {totals.exp.toFixed(2)} €
          </div>
        </div>
        <div style={styles.card}>
          <h3>Solde</h3>
          <div
            style={{
              color: balance >= 0 ? "#3498db" : "#e74c3c",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            {balance.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setType("expenses")}
          style={{
            ...styles.tabBtn,
            ...(type === "expenses" ? styles.activeTab : {}),
          }}
        >
          Dépenses
        </button>
        <button
          onClick={() => setType("income")}
          style={{
            ...styles.tabBtn,
            ...(type === "income" ? styles.activeTab : {}),
          }}
        >
          Revenus
        </button>
      </div>

      {/* Form */}
      <form onSubmit={addTransaction} style={styles.form}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.input}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Note"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={styles.input}
        />
        <button
          type="submit"
          style={{
            padding: "0.6rem 1.2rem",
            background: "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </form>

      {/* Category Filter Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <label style={{ fontWeight: "bold" }}>Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "0.6rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            minWidth: "150px",
          }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th
              style={{
                ...styles.thTd,
                background: "#f1f1f1",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => handleSort("date")}
              title="Sort by Date"
            >
              Date{" "}
              {sortConfig.key === "date" &&
                (sortConfig.direction === "asc" ? " ↑" : " ↓")}
            </th>
            <th
              style={{
                ...styles.thTd,
                background: "#f1f1f1",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => handleSort("category")}
              title="Sort by Category"
            >
              Category{" "}
              {sortConfig.key === "category" &&
                (sortConfig.direction === "asc" ? " ↑" : " ↓")}
            </th>
            <th
              style={{
                ...styles.thTd,
                background: "#f1f1f1",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => handleSort("description")}
              title="Sort by Description"
            >
              Description{" "}
              {sortConfig.key === "description" &&
                (sortConfig.direction === "asc" ? " ↑" : " ↓")}
            </th>
            <th
              style={{
                ...styles.thTd,
                background: "#f1f1f1",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => handleSort("amount")}
              title="Sort by Amount"
            >
              Amount{" "}
              {sortConfig.key === "amount" &&
                (sortConfig.direction === "asc" ? " ↑" : " ↓")}
            </th>
            <th
              style={{
                ...styles.thTd,
                background: "#f1f1f1",
                fontWeight: "bold",
              }}
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                No records
              </td>
            </tr>
          )}
          {list.map((t) => (
            <tr key={t.id}>
              <td style={styles.thTd}>{t.date}</td>
              <td style={styles.thTd}>
                <span
                  style={{
                    ...styles.badge,
                    background: t.type === "income" ? "#d5f5e3" : "#fadbd8",
                    color: t.type === "income" ? "#27ae60" : "#c0392b",
                  }}
                >
                  {t.category}
                </span>
              </td>
              <td style={styles.thTd}>{t.description || "-"}</td>
              <td
                style={{
                  ...styles.thTd,
                  color: t.type === "income" ? "#27ae60" : "#c0392b",
                  fontWeight: "bold",
                }}
              >
                {t.type === "income" ? "+" : "-"}
                {t.amount.toFixed(2)} €
              </td>
              <td style={styles.thTd}>
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Del
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
