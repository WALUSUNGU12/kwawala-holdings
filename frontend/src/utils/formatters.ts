import { format, parseISO } from 'date-fns';

/**
 * Formats a currency value into a MWK string.
 * @param amount The number to format.
 * @returns A string like 'MWK 1,234.56'.
 */
export const formatCurrency = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return 'MWK 0.00';
  }
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    currencyDisplay: 'code',
  }).format(numericAmount).replace('MWK', 'MWK ').trim();
};

/**
 * Formats a date string into a more readable format.
 * @param dateString The ISO date string to format.
 * @returns A string like 'Jan 01, 2023'.
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'N/A';
  }
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};
