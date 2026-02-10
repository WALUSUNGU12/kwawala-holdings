import { apiSlice } from '../../app/api/apiSlice';
import { Expense, ExpensePayload, ExpenseSummaryData } from './expenseTypes';

// Define tag types for the API
const EXPENSE_TAG = 'Expense' as const;
const EXPENSE_SUMMARY_TAG = 'ExpenseSummary' as const;

export const expenseApi = apiSlice.enhanceEndpoints({
  addTagTypes: [EXPENSE_TAG, EXPENSE_SUMMARY_TAG],
}).injectEndpoints({
  endpoints: (builder) => ({
    // Get all expenses
    getExpenses: builder.query<Expense[], void>({
      query: () => '/expenses',
      providesTags: (result = []) => [
        EXPENSE_TAG,
        ...result.map(({ id }) => ({ type: EXPENSE_TAG, id })),
      ],
    }),

    // Get single expense by ID
    getExpenseById: builder.query<Expense, string>({
      query: (id) => `/expenses/${id}`,
      providesTags: (_result, _error, id) => [{ type: EXPENSE_TAG, id: id || 'LIST' }],
    }),

    // Create new expense
    createExpense: builder.mutation<Expense, ExpensePayload>({
      query: (expense) => ({
        url: '/expenses',
        method: 'POST',
        body: expense,
      }),
      invalidatesTags: [EXPENSE_TAG, EXPENSE_SUMMARY_TAG],
    }),

    // Update existing expense
    updateExpense: builder.mutation<Expense, { id: string; body: Partial<ExpensePayload> }>({
      query: ({ id, body }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: EXPENSE_TAG, id },
        EXPENSE_SUMMARY_TAG,
      ],
    }),

    // Delete expense
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [EXPENSE_TAG, EXPENSE_SUMMARY_TAG],
    }),

    // Get expenses by project
    getExpensesByProject: builder.query<ExpenseSummaryData, { projectId: string }>({
      query: ({ projectId }) => ({
        url: `/expenses/project/${projectId}`,
      }),
      providesTags: (_result, _error, args) => [
        { type: EXPENSE_TAG, id: args.projectId },
        EXPENSE_SUMMARY_TAG,
      ],
    }),

    // Get expense summary
    getExpenseSummary: builder.query<ExpenseSummaryData, void>({
      query: () => '/expenses/summary',
      providesTags: [EXPENSE_SUMMARY_TAG],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpensesByProjectQuery,
  useGetExpenseSummaryQuery,
} = expenseApi;
