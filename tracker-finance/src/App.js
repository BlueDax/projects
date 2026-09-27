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

const CHART_COLORS = [
  "#3498db",
  "#e67e22",
  "#9b59b6",
  "#1abc9c",
  "#f1c40f",
  "#e74c3c",
  "#34495e",
];

function getMonthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getSectorPath(startAngle, endAngle, radius) {
  const startX = 100 + radius * Math.cos((startAngle * Math.PI) / 180);
  const startY = 100 + radius * Math.sin((startAngle * Math.PI) / 180);
  const endX = 100 + radius * Math.cos((endAngle * Math.PI) / 180);
  const endY = 100 + radius * Math.sin((endAngle * Math.PI) / 180);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M 100 100 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function CategoryPieChart({ title, label, data, total }) {
  let currentAngle = -90;

  return (
    <section style={styles.chartCard}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {data.length === 0 ? (
        <p style={{ color: "#666" }}>No data yet</p>
      ) : (
        <div style={styles.chartContent}>
          <svg
            viewBox="0 0 200 200"
            role="img"
            aria-label={`${label} breakdown by category`}
            style={styles.pie}
          >
            <title>{title}</title>
            {data.length === 1 ? (
              <circle
                cx="100"
                cy="100"
                r="100"
                fill={CHART_COLORS[0]}
              />
            ) : (
              data.map((item, index) => {
                const endAngle = currentAngle + (item.amount / total) * 360;
                const path = getSectorPath(currentAngle, endAngle, 100);
                currentAngle = endAngle;

                return (
                  <path
                    key={item.category}
                    d={path}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="#fff"
                    strokeWidth="1"
                  >
                    <title>
                      {item.category}: {item.amount.toFixed(2)} € (
                      {((item.amount / total) * 100).toFixed(1)}%)
                    </title>
                  </path>
                );
              })
            )}
          </svg>
          <ul style={styles.chartLegend}>
            {data.map((item, index) => (
              <li key={item.category} style={styles.legendItem}>
                <span
                  aria-hidden="true"
                  style={{
                    ...styles.legendSwatch,
                    background: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span>
                  {item.category}: {item.amount.toFixed(2)} € (
                  {((item.amount / total) * 100).toFixed(1)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// Simple inline styles for brevity
const styles = {
  container: {
    maxWidth: "900px",
    margin: "2rem auto",
    padding: "0 1rem",
    fontFamily: 'sans-serif',
  },
  dashboard: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  charts: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  chartCard: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    flex: "1 1 320px",
    minWidth: 0,
  },
  chartContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  pie: {
    width: "min(100%, 220px)",
    height: "auto",
    flex: "0 1 220px",
  },
  chartLegend: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    flex: "1 1 180px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.6rem",
    fontSize: "0.9rem",
  },
  legendSwatch: {
    width: "0.8rem",
    height: "0.8rem",
    borderRadius: "2px",
    flexShrink: 0,
  },
  card: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    flex: 1,
    textAlign: "center",
  },
  periodControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
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

  const [selectedMonth, setSelectedMonth] = useState(() =>
    getMonthValue(new Date()),
  );
  const [type, setType] = useState("expenses"); // 'expenses' or 'income'
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Alimentaire");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [desc, setDesc] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const changeMonth = (month) => {
    setSelectedMonth(month);
    if (date.slice(0, 7) !== month) {
      setDate(`${month}-01`);
    }
  };

  const shiftMonth = (offset) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextMonth = new Date(year, month - 1 + offset, 1);
    changeMonth(getMonthValue(nextMonth));
  };

  // Save whenever transactions change
  useEffect(() => {
    localStorage.setItem("myFinanceData", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (e) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!amount || !date) return alert("Please fill amount and date");
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return alert("Amount must be a positive number");
    }

    const newTx = {
      id: Date.now(),
      type,
      amount: parsedAmount,
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
  const periodTransactions = selectedMonth
    ? transactions.filter((transaction) =>
        transaction.date.startsWith(selectedMonth),
      )
    : transactions;
  const totals = periodTransactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.inc += t.amount;
      else acc.exp += t.amount;
      return acc;
    },
    { inc: 0, exp: 0 },
  );
  const balance = totals.inc - totals.exp;
  const categoryTotals = (transactionType) =>
    periodTransactions
      .filter((transaction) => transaction.type === transactionType)
      .reduce((categories, transaction) => {
        categories[transaction.category] =
          (categories[transaction.category] || 0) + transaction.amount;
        return categories;
      }, {});
  const expenseTotalByCategory = categoryTotals("expenses");
  const incomeTotalByCategory = categoryTotals("income");
  const expenseData = Object.entries(expenseTotalByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .filter((item) => item.amount > 0);
  const incomeData = Object.entries(incomeTotalByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .filter((item) => item.amount > 0);

  const list = [...periodTransactions] // Create a copy to avoid mutating state
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

      <div
        className="periodControls"
        style={styles.periodControls}
        aria-label="View period"
      >
        {selectedMonth && (
          <>
            <button
              type="button"
              aria-label="Previous month"
              className="button button--icon"
              onClick={() => shiftMonth(-1)}
            >
              &lt;
            </button>
            <input
              type="month"
              aria-label="Selected month"
              value={selectedMonth}
              onChange={(event) => changeMonth(event.target.value)}
            />
            <button
              type="button"
              aria-label="Next month"
              className="button button--icon"
              onClick={() => shiftMonth(1)}
            >
              &gt;
            </button>
          </>
        )}
        <button
          type="button"
          aria-pressed={!selectedMonth}
          className="button button--period"
          onClick={() => setSelectedMonth(null)}
        >
          Total view
        </button>
        {!selectedMonth && (
          <button
            type="button"
            className="button button--period"
            onClick={() => changeMonth(getMonthValue(new Date()))}
          >
            Current month
          </button>
        )}
      </div>

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

      <div style={styles.charts}>
        <CategoryPieChart
          title="Dépenses par catégorie"
          label="Expense"
          data={expenseData}
          total={totals.exp}
        />
        <CategoryPieChart
          title="Revenus par catégorie"
          label="Income"
          data={incomeData}
          total={totals.inc}
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`button button--tab${type === "expenses" ? " is-active" : ""}`}
          aria-pressed={type === "expenses"}
          onClick={() => setType("expenses")}
        >
          Dépenses
        </button>
        <button
          type="button"
          className={`button button--tab${type === "income" ? " is-active" : ""}`}
          aria-pressed={type === "income"}
          onClick={() => setType("income")}
        >
          Revenus
        </button>
      </div>

      {/* Form */}
      <form onSubmit={addTransaction} style={styles.form}>
        <input
          type="number"
          placeholder="Amount"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => {
            if (e.target.value === "" || Number(e.target.value) > 0) {
              setAmount(e.target.value);
            }
          }}
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
          className="button button--primary"
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
                  type="button"
                  className="button button--danger"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
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
