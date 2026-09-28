import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('does not allow a negative amount in the input', () => {
  render(<App />);
  const amountInput = screen.getByLabelText('Transaction amount');

  expect(amountInput).toHaveAttribute('min', '0.01');
  expect(amountInput).toHaveAttribute('step', '0.01');

  fireEvent.change(amountInput, { target: { value: '-1' } });

  expect(amountInput).toHaveValue(null);
});

test('keeps non-negative amounts available for submission', () => {
  render(<App />);
  const amountInput = screen.getByLabelText('Transaction amount');

  fireEvent.change(amountInput, { target: { value: '12.50' } });

  expect(amountInput).toHaveValue(12.5);
});

test('shows separate expense and income charts grouped by category', () => {
  localStorage.setItem(
    'myFinanceData',
    JSON.stringify([
      { id: 1, type: 'expenses', amount: 40, category: 'Alimentaire', date: '2026-09-01' },
      { id: 2, type: 'expenses', amount: 10, category: 'Transport', date: '2026-09-02' },
      { id: 3, type: 'income', amount: 100, category: 'Salaires', date: '2026-09-03' },
    ]),
  );

  render(<App />);
  fireEvent.change(screen.getByLabelText('Selected month'), {
    target: { value: '2026-09' },
  });

  expect(screen.getByRole('img', { name: 'Expense breakdown by category' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Income breakdown by category' })).toBeInTheDocument();
  expect(screen.getAllByText('Alimentaire: 40.00 € (80.0%)')).toHaveLength(2);
  expect(screen.getAllByText('Transport: 10.00 € (20.0%)')).toHaveLength(2);
  expect(screen.getByText('Salaires: 100.00 € (100.0%)')).toBeInTheDocument();
});

test('filters records by month and shows all records in the total view', () => {
  localStorage.setItem(
    'myFinanceData',
    JSON.stringify([
      { id: 1, type: 'expenses', amount: 40, category: 'Alimentaire', date: '2026-09-10' },
      { id: 2, type: 'income', amount: 75, category: 'Salaires', date: '2026-08-12' },
    ]),
  );

  render(<App />);
  fireEvent.change(screen.getByLabelText('Selected month'), {
    target: { value: '2026-09' },
  });

  expect(screen.getByText('2026-09-10')).toBeInTheDocument();
  expect(screen.queryByText('2026-08-12')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Total view' }));

  expect(screen.getByText('2026-09-10')).toBeInTheDocument();
  expect(screen.queryByText('2026-08-12')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Revenus' }));

  expect(screen.getByText('2026-08-12')).toBeInTheDocument();
  expect(screen.queryByText('2026-09-10')).not.toBeInTheDocument();
  
  expect(screen.getByText('Current month')).toBeInTheDocument();
});

test('creates all due recurring transactions without creating duplicates', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-28T12:00:00'));
  localStorage.setItem(
    'myFinanceRecurring',
    JSON.stringify([
      {
        id: 'weekly-rent',
        type: 'expenses',
        amount: 20,
        category: 'Logement',
        description: 'Weekly',
        frequency: 'weekly',
        startDate: '2026-09-14',
        nextDate: '2026-09-14',
        anchorDay: 14,
      },
      {
        id: 'monthly-salary',
        type: 'income',
        amount: 100,
        category: 'Salaires',
        description: 'Monthly',
        frequency: 'monthly',
        startDate: '2026-08-15',
        nextDate: '2026-08-15',
        anchorDay: 15,
      },
      {
        id: 'yearly-repair',
        type: 'expenses',
        amount: 50,
        category: 'Réparations',
        description: 'Yearly',
        frequency: 'yearly',
        startDate: '2025-09-28',
        nextDate: '2025-09-28',
        anchorDay: 28,
      },
    ]),
  );

  const { unmount } = render(<App />);
  const savedTransactions = JSON.parse(localStorage.getItem('myFinanceData'));

  expect(savedTransactions).toHaveLength(7);
  expect(savedTransactions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'weekly-rent-2026-09-14' }),
      expect.objectContaining({ id: 'weekly-rent-2026-09-21' }),
      expect.objectContaining({ id: 'weekly-rent-2026-09-28' }),
      expect.objectContaining({ id: 'monthly-salary-2026-08-15' }),
      expect.objectContaining({ id: 'monthly-salary-2026-09-15' }),
      expect.objectContaining({ id: 'yearly-repair-2025-09-28' }),
      expect.objectContaining({ id: 'yearly-repair-2026-09-28' }),
    ]),
  );
  expect(JSON.parse(localStorage.getItem('myFinanceRecurring'))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'weekly-rent', nextDate: '2026-10-05' }),
      expect.objectContaining({ id: 'monthly-salary', nextDate: '2026-10-15' }),
      expect.objectContaining({ id: 'yearly-repair', nextDate: '2027-09-28' }),
    ]),
  );

  unmount();
  render(<App />);
  expect(JSON.parse(localStorage.getItem('myFinanceData'))).toHaveLength(7);
  jest.useRealTimers();
});

test('saves a recurring transaction using the selected income or expense type', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Revenus' }));
  fireEvent.change(screen.getByLabelText('Recurring amount'), {
    target: { value: '500' },
  });
  fireEvent.change(screen.getByLabelText('Recurring category'), {
    target: { value: 'Salaires' },
  });
  fireEvent.change(screen.getByLabelText('Recurring frequency'), {
    target: { value: 'yearly' },
  });
  fireEvent.change(screen.getByLabelText('Recurring start date'), {
    target: { value: '2099-01-10' },
  });
  fireEvent.change(screen.getByLabelText('Recurring description'), {
    target: { value: 'Annual salary' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add recurring' }));

  const [savedTemplate] = JSON.parse(localStorage.getItem('myFinanceRecurring'));
  expect(savedTemplate).toEqual(
    expect.objectContaining({
      type: 'income',
      amount: 500,
      category: 'Salaires',
      frequency: 'yearly',
      startDate: '2099-01-10',
      nextDate: '2099-01-10',
      anchorDay: 10,
      description: 'Annual salary',
    }),
  );
  expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
});
