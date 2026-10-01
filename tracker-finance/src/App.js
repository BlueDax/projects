import React, { useRef, useState, useEffect } from "react";

const CATEGORIES = [
  "Alimentaire",
  "Transport",
  "Salaires",
  "Logement",
  "Réparations",
  "Divertissement/Loisirs",
  "Retrait d'argent",
  'Santé',
  "Investissements",
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

const RECURRING_STORAGE_KEY = "myFinanceRecurring";
const THEME_STORAGE_KEY = "myFinanceTheme";
const FREQUENCY_LABELS = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getNextRecurringDate(template) {
  const [year, month, day] = template.nextDate.split("-").map(Number);

  if (template.frequency === "weekly") {
    return new Date(Date.UTC(year, month - 1, day + 7))
      .toISOString()
      .slice(0, 10);
  }

  const nextYear = template.frequency === "yearly" ? year + 1 : year;
  const nextMonth =
    template.frequency === "yearly" ? month - 1 : month;
  const monthDays = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  const nextDay = Math.min(template.anchorDay, monthDays);

  return new Date(Date.UTC(nextYear, nextMonth, nextDay))
    .toISOString()
    .slice(0, 10);
}

function createDueTransactions(templates, transactions, today) {
  const updatedTransactions = [...transactions];
  const updatedTemplates = templates.map((template) => ({ ...template }));
  const transactionIds = new Set(transactions.map((transaction) => transaction.id));
  let changed = false;

  updatedTemplates.forEach((template) => {
    while (template.nextDate <= today) {
      const id = `${template.id}-${template.nextDate}`;
      if (!transactionIds.has(id)) {
        updatedTransactions.push({
          id,
          type: template.type,
          amount: template.amount,
          category: template.category,
          date: template.nextDate,
          description: template.description,
        });
        transactionIds.add(id);
      }
      template.nextDate = getNextRecurringDate(template);
      changed = true;
    }
  });

  return {
    transactions: updatedTransactions,
    templates: updatedTemplates,
    changed,
  };
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
  const legendData = [...data].sort((first, second) => second.amount - first.amount);

  return (
    <section style={styles.chartCard}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {data.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Pas de données disponibles</p>
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
                    stroke="var(--surface)"
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
            {legendData.map((item) => (
              <li key={item.category} style={styles.legendItem}>
                <span
                  aria-hidden="true"
                  style={{
                    ...styles.legendSwatch,
                    background:
                      CHART_COLORS[
                        data.findIndex(
                          (chartItem) => chartItem.category === item.category,
                        ) % CHART_COLORS.length
                      ],
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
    margin: "0 auto",
    padding: "2rem 1rem",
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
    background: "var(--surface)",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "var(--shadow)",
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
    background: "var(--surface)",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "var(--shadow)",
    flex: 1,
    textAlign: "center",
  },
  predictedTotal: {
    color: "var(--forecast-text)",
    fontSize: "0.9rem",
    fontWeight: "600",
    marginTop: "0.5rem",
  },
  upcomingRow: {
    background: "var(--forecast-row)",
  },
  upcomingBadge: {
    display: "inline-block",
    marginLeft: "0.5rem",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
    background: "var(--forecast-badge)",
    color: "var(--forecast-text)",
    fontSize: "0.75rem",
    fontWeight: "bold",
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
    background: "var(--surface)",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  recurringSection: {
    marginBottom: "2rem",
    padding: "1.5rem",
    background: "var(--surface)",
    borderRadius: "8px",
    boxShadow: "var(--shadow)",
  },
  recurringList: {
    display: "grid",
    gap: "0.75rem",
    padding: 0,
    margin: "1rem 0 0",
    listStyle: "none",
  },
  recurringItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
    padding: "0.75rem 1rem",
    border: "1px solid var(--border)",
    borderRadius: "8px",
  },
  input: {
    padding: "0.6rem",
    border: "1px solid var(--border-strong)",
    borderRadius: "4px",
    flex: 1,
    background: "var(--input-surface)",
    color: "var(--text)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "var(--surface)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  thTd: {
    padding: "1rem",
    textAlign: "left",
    borderBottom: "1px solid var(--border)",
  },
  badge: {
    padding: "0.2rem 0.6rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  // Load from LocalStorage on init
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("myFinanceData");
    return saved ? JSON.parse(saved) : [];
  });
  const [recurringTemplates, setRecurringTemplates] = useState(() => {
    const saved = localStorage.getItem(RECURRING_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedMonth, setSelectedMonth] = useState(() =>
    getMonthValue(new Date()),
  );
  const [type, setType] = useState("expenses"); // 'expenses' or 'income'
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Alimentaire");
  const [date, setDate] = useState(getLocalDateValue());
  const [desc, setDesc] = useState("");
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringCategory, setRecurringCategory] = useState("Alimentaire");
  const [recurringStartDate, setRecurringStartDate] = useState(
    getLocalDateValue(),
  );
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [recurringDescription, setRecurringDescription] = useState("");
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [editRecurringType, setEditRecurringType] = useState("expenses");
  const [editRecurringAmount, setEditRecurringAmount] = useState("");
  const [editRecurringCategory, setEditRecurringCategory] =
    useState("Alimentaire");
  const [editRecurringFrequency, setEditRecurringFrequency] =
    useState("monthly");
  const [editRecurringNextDate, setEditRecurringNextDate] =
    useState(getLocalDateValue());
  const [editRecurringDescription, setEditRecurringDescription] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editType, setEditType] = useState("expenses");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Alimentaire");
  const [editDate, setEditDate] = useState(getLocalDateValue());
  const [editDescription, setEditDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const importInputRef = useRef(null);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  };

  const changeMonth = (month) => {
    setSelectedMonth(month);
  };

  const shiftMonth = (offset) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextMonth = new Date(year, month - 1 + offset, 1);
    changeMonth(getMonthValue(nextMonth));
  };

  const exportData = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      recurringTemplates,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `finance-backup-${getLocalDateValue()}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = JSON.parse(await file.text());
      const importedTransactions = imported.transactions;
      const importedRecurringTemplates = imported.recurringTemplates;

      if (
        !Array.isArray(importedTransactions) ||
        !Array.isArray(importedRecurringTemplates) ||
        importedTransactions.some(
          (transaction) =>
            !transaction ||
            transaction.id === undefined ||
            !["income", "expenses"].includes(transaction.type) ||
            !Number.isFinite(Number(transaction.amount)) ||
            !transaction.category ||
            !transaction.date,
        ) ||
        importedRecurringTemplates.some(
          (template) =>
            !template ||
            !template.id ||
            !["income", "expenses"].includes(template.type) ||
            !Number.isFinite(Number(template.amount)) ||
            !template.category ||
            !template.nextDate ||
            !FREQUENCY_LABELS[template.frequency],
        )
      ) {
        throw new Error("Invalid backup format");
      }

      if (
        window.confirm(
          "Importing this backup will replace your current transactions. Continue?",
        )
      ) {
        setTransactions(importedTransactions);
        setRecurringTemplates(importedRecurringTemplates);
      }
    } catch {
      window.alert("Could not import this file. Choose a valid finance backup.");
    } finally {
      event.target.value = "";
    }
  };

  // Save whenever transactions change
  useEffect(() => {
    localStorage.setItem("myFinanceData", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      RECURRING_STORAGE_KEY,
      JSON.stringify(recurringTemplates),
    );
  }, [recurringTemplates]);

  useEffect(() => {
    const result = createDueTransactions(
      recurringTemplates,
      transactions,
      getLocalDateValue(),
    );
    if (result.changed) {
      setTransactions(result.transactions);
      setRecurringTemplates(result.templates);
    }
  }, [recurringTemplates, transactions]);

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

  const startEditingTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setEditType(transaction.type);
    setEditAmount(String(transaction.amount));
    setEditCategory(transaction.category);
    setEditDate(transaction.date);
    setEditDescription(transaction.description || "");
  };

  const cancelEditingTransaction = () => {
    setEditingTransaction(null);
  };

  const saveEditedTransaction = (e) => {
    e.preventDefault();
    const parsedAmount = Number(editAmount);
    if (!editAmount || !editDate) {
      return alert("Please fill amount and date");
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return alert("Amount must be a positive number");
    }

    setTransactions((previous) =>
      previous.map((transaction) =>
        transaction.id === editingTransaction.id
          ? {
              ...transaction,
              type: editType,
              amount: parsedAmount,
              category: editCategory,
              date: editDate,
              description: editDescription,
            }
          : transaction,
      ),
    );
    setEditingTransaction(null);
  };

  const addRecurringTransaction = (e) => {
    e.preventDefault();
    const parsedAmount = Number(recurringAmount);
    if (!recurringAmount || !recurringStartDate) {
      return alert("Please fill amount and start date");
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return alert("Amount must be a positive number");
    }

    const newTemplate = {
      id: `recurring-${Date.now()}`,
      type,
      amount: parsedAmount,
      category: recurringCategory,
      description: recurringDescription,
      frequency: recurringFrequency,
      startDate: recurringStartDate,
      nextDate: recurringStartDate,
      anchorDay: Number(recurringStartDate.slice(8, 10)),
    };
    setRecurringTemplates((previous) => [...previous, newTemplate]);
    setRecurringAmount("");
    setRecurringDescription("");
  };

  const startEditingRecurringTransaction = (template) => {
    setEditingRecurringId(template.id);
    setEditRecurringType(template.type);
    setEditRecurringAmount(String(template.amount));
    setEditRecurringCategory(template.category);
    setEditRecurringFrequency(template.frequency);
    setEditRecurringNextDate(template.nextDate);
    setEditRecurringDescription(template.description || "");
  };

  const saveEditedRecurringTransaction = (e) => {
    e.preventDefault();
    const parsedAmount = Number(editRecurringAmount);
    if (!editRecurringAmount || !editRecurringNextDate) {
      return alert("Please fill amount and next date");
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return alert("Amount must be a positive number");
    }

    setRecurringTemplates((previous) =>
      previous.map((template) =>
        template.id === editingRecurringId
          ? {
              ...template,
              type: editRecurringType,
              amount: parsedAmount,
              category: editRecurringCategory,
              frequency: editRecurringFrequency,
              nextDate: editRecurringNextDate,
              anchorDay: Number(editRecurringNextDate.slice(8, 10)),
              description: editRecurringDescription,
            }
          : template,
      ),
    );
    setEditingRecurringId(null);
  };

  const deleteRecurringTransaction = (id) => {
    if (window.confirm("Stop this recurring transaction?")) {
      setRecurringTemplates((previous) =>
        previous.filter((template) => template.id !== id),
      );
    }
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
  const today = getLocalDateValue();
  const upcomingTransactions = periodTransactions.filter(
    (transaction) => transaction.date > today,
  );
  const completedTransactions = periodTransactions.filter(
    (transaction) => transaction.date <= today,
  );
  const totals = completedTransactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.inc += t.amount;
      else acc.exp += t.amount;
      return acc;
    },
    { inc: 0, exp: 0 },
  );
  const predictedTotals = upcomingTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") acc.inc += transaction.amount;
      else acc.exp += transaction.amount;
      return acc;
    },
    { inc: 0, exp: 0 },
  );
  const balance = totals.inc - totals.exp;
  const projectedBalance = balance + predictedTotals.inc - predictedTotals.exp;
  const categoryTotals = (transactionType) =>
    completedTransactions
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
    <div className="app-theme" data-theme={theme}>
      <div className="app-shell" style={styles.container}>
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
          Total
        </button>
        {!selectedMonth && (
          <button
            type="button"
            className="button button--period"
            onClick={() => changeMonth(getMonthValue(new Date()))}
          >
            Mois en cours
          </button>
        )}
        <button
          type="button"
          className="button button--period"
          onClick={() => importInputRef.current?.click()}
        >
          Importer
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          aria-label="Import finance backup"
          onChange={importData}
          hidden
        />
        <button
          type="button"
          className="button button--period"
          onClick={exportData}
        >
          Exporter
        </button>
        <button
          type="button"
          className="button button--period theme-toggle"
          aria-label="Dark mode"
          aria-pressed={theme === "dark"}
          onClick={toggleTheme}
        >
          Dark mode
        </button>
      </div>

      {/* Dashboard */}
      <div style={styles.dashboard}>
        <div style={styles.card}>
          <h3>Revenus</h3>
          <div
            style={{ color: "var(--income)", fontSize: "1.5rem", fontWeight: "bold" }}
          >
            {totals.inc.toFixed(2)} €
          </div>
          <div style={styles.predictedTotal}>
            Prévu : {(totals.inc + predictedTotals.inc).toFixed(2)} €
          </div>
        </div>
        <div style={styles.card}>
          <h3>Dépenses</h3>
          <div
            style={{ color: "var(--expense)", fontSize: "1.5rem", fontWeight: "bold" }}
          >
            {totals.exp.toFixed(2)} €
          </div>
          <div style={styles.predictedTotal}>
            Prévu : {(totals.exp + predictedTotals.exp).toFixed(2)} €
          </div>
        </div>
        <div style={styles.card}>
          <h3>Solde</h3>
          <div
            style={{
              color: balance >= 0 ? "var(--accent)" : "var(--expense)",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            {balance.toFixed(2)} €
          </div>
          <div
            style={{
              color: "var(--forecast-text)",
              fontSize: "0.9rem",
              fontWeight: "600",
              marginTop: "0.4rem",
            }}
          >
            Prévu : {projectedBalance.toFixed(2)} €
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
          placeholder="Montant"
          aria-label="Transaction amount"
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
          Ajouter
        </button>
      </form>

      <section style={styles.recurringSection}>
        <h2 style={{ marginTop: 0 }}>Transactions récurrentes</h2>
        <p>
          Les transactions récurrentes sont ajoutées automatiquement, 
          y compris les occurrences manquées, lorsque le gestionnaire est ouvert.
        </p>
        <form onSubmit={addRecurringTransaction} style={styles.form}>
          <input
            type="number"
            placeholder="Montant"
            aria-label="Recurring amount"
            min="0.01"
            step="0.01"
            value={recurringAmount}
            onChange={(event) => {
              if (
                event.target.value === "" ||
                Number(event.target.value) > 0
              ) {
                setRecurringAmount(event.target.value);
              }
            }}
            style={styles.input}
            required
          />
          <select
            aria-label="Recurring category"
            value={recurringCategory}
            onChange={(event) => setRecurringCategory(event.target.value)}
            style={styles.input}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            aria-label="Recurring frequency"
            value={recurringFrequency}
            onChange={(event) => setRecurringFrequency(event.target.value)}
            style={styles.input}
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="Recurring start date"
            value={recurringStartDate}
            onChange={(event) => setRecurringStartDate(event.target.value)}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Description (optionelle)"
            aria-label="Recurring description"
            value={recurringDescription}
            onChange={(event) => setRecurringDescription(event.target.value)}
            style={styles.input}
          />
          <button type="submit" className="button button--primary">
            Ajouter récurrent
          </button>
        </form>
        {recurringTemplates.length > 0 && (
          <ul style={styles.recurringList}>
            {recurringTemplates.map((template) => (
              <li key={template.id} style={styles.recurringItem}>
                <span>
                  <strong>{template.category}</strong>
                  {" · "}
                  {template.type === "income" ? "Revenu" : "Dépense"}
                  {" · "}
                  {template.amount.toFixed(2)} €
                  {" · "}
                  {FREQUENCY_LABELS[template.frequency]}
                  {" · "}
                  Prochain: {template.nextDate}
                  {template.description ? ` · ${template.description}` : ""}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="button button--period"
                    aria-label={`Edit recurring ${template.category}`}
                    onClick={() => startEditingRecurringTransaction(template)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => deleteRecurringTransaction(template.id)}
                  >
                    Annuler
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {editingRecurringId && (
          <form
            onSubmit={saveEditedRecurringTransaction}
            style={{ ...styles.form, marginTop: "1rem", marginBottom: 0 }}
            aria-label="Edit recurring transaction"
          >
            <select
              aria-label="Edit recurring type"
              value={editRecurringType}
              onChange={(event) => setEditRecurringType(event.target.value)}
              style={styles.input}
            >
              <option value="expenses">Dépenses</option>
              <option value="income">Revenus</option>
            </select>
            <input
              type="number"
              aria-label="Edit recurring amount"
              min="0.01"
              step="0.01"
              value={editRecurringAmount}
              onChange={(event) => setEditRecurringAmount(event.target.value)}
              style={styles.input}
              required
            />
            <select
              aria-label="Edit recurring category"
              value={editRecurringCategory}
              onChange={(event) => setEditRecurringCategory(event.target.value)}
              style={styles.input}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              aria-label="Edit recurring frequency"
              value={editRecurringFrequency}
              onChange={(event) => setEditRecurringFrequency(event.target.value)}
              style={styles.input}
            >
              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Edit recurring next date"
              value={editRecurringNextDate}
              onChange={(event) => setEditRecurringNextDate(event.target.value)}
              style={styles.input}
              required
            />
            <input
              type="text"
              aria-label="Edit recurring description"
              value={editRecurringDescription}
              onChange={(event) =>
                setEditRecurringDescription(event.target.value)
              }
              style={styles.input}
            />
            <button type="submit" className="button button--primary">
              Enregistrer les modifications
            </button>
            <button
              type="button"
              className="button button--period"
              onClick={() => setEditingRecurringId(null)}
            >
              Annuler
            </button>
          </form>
        )}
      </section>

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
        <label style={{ fontWeight: "bold" }}>Filtrer par catégorie:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "0.6rem",
            border: "1px solid var(--border-strong)",
            borderRadius: "4px",
            minWidth: "150px",
            background: "var(--input-surface)",
            color: "var(--text)",
          }}
        >
          <option value="All">Toutes les catégories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {editingTransaction && (
        <section aria-labelledby="edit-transaction-heading">
          <h2 id="edit-transaction-heading">Modifier la transaction</h2>
          <form onSubmit={saveEditedTransaction} style={styles.form}>
            <select
              aria-label="Edit transaction type"
              value={editType}
              onChange={(event) => setEditType(event.target.value)}
              style={styles.input}
            >
              <option value="expenses">Dépenses</option>
              <option value="income">Revenus</option>
            </select>
            <input
              type="number"
              aria-label="Edit transaction amount"
              min="0.01"
              step="0.01"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
              style={styles.input}
              required
            />
            <select
              aria-label="Edit transaction category"
              value={editCategory}
              onChange={(event) => setEditCategory(event.target.value)}
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
              aria-label="Edit transaction date"
              value={editDate}
              onChange={(event) => setEditDate(event.target.value)}
              style={styles.input}
              required
            />
            <input
              type="text"
              aria-label="Edit transaction description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              style={styles.input}
            />
            <button type="submit" className="button button--primary">
              Enregistrer les modifications
            </button>
            <button
              type="button"
              className="button button--period"
              onClick={cancelEditingTransaction}
            >
              Annuler
            </button>
          </form>
        </section>
      )}

      {/* List */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th
              style={{
                ...styles.thTd,
                background: "var(--table-head)",
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
                background: "var(--table-head)",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => handleSort("category")}
              title="Sort by Category"
            >
              Catégorie{" "}
              {sortConfig.key === "category" &&
                (sortConfig.direction === "asc" ? " ↑" : " ↓")}
            </th>
            <th
              style={{
                ...styles.thTd,
                background: "var(--table-head)",
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
                background: "var(--table-head)",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => handleSort("amount")}
              title="Sort by Amount"
            >
              Montant{" "}
              {sortConfig.key === "amount" &&
                (sortConfig.direction === "asc" ? " ↑" : " ↓")}
            </th>
            <th
              style={{
                ...styles.thTd,
                background: "var(--table-head)",
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
                Aucun enregistrement
              </td>
            </tr>
          )}
          {list.map((t) => {
            const isUpcoming = t.date > today;

            return (
            <tr
              key={t.id}
              style={isUpcoming ? styles.upcomingRow : undefined}
            >
              <td style={styles.thTd}>
                {t.date}
                {isUpcoming && <span style={styles.upcomingBadge}>À venir</span>}
              </td>
              <td style={styles.thTd}>
                <span
                  style={{
                    ...styles.badge,
                    background:
                      t.type === "income"
                        ? "var(--income-surface)"
                        : "var(--expense-surface)",
                    color:
                      t.type === "income" ? "var(--income)" : "var(--expense)",
                  }}
                >
                  {t.category}
                </span>
              </td>
              <td style={styles.thTd}>{t.description || "-"}</td>
              <td
                style={{
                  ...styles.thTd,
                  color:
                    t.type === "income" ? "var(--income)" : "var(--expense)",
                  fontWeight: "bold",
                }}
              >
                {t.type === "income" ? "+" : "-"}
                {t.amount.toFixed(2)} €
              </td>
              <td style={styles.thTd}>
                <div className="transaction-actions">
                  <button
                    type="button"
                    className="button button--period"
                    onClick={() => startEditingTransaction(t)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => handleDelete(t.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
