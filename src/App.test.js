import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard layout header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Panel de Administración/i);
  expect(headerElement).toBeInTheDocument();
});
