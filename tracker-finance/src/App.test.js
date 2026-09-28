import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('does not allow a negative amount in the input', () => {
  render(<App />);
  const amountInput = screen.getByPlaceholderText('Amount');

  expect(amountInput).toHaveAttribute('min', '0.01');
  expect(amountInput).toHaveAttribute('step', '0.01');

  fireEvent.change(amountInput, { target: { value: '-1' } });

  expect(amountInput).toHaveValue(null);
});

test('keeps non-negative amounts available for submission', () => {
  render(<App />);
  const amountInput = screen.getByPlaceholderText('Amount');

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
