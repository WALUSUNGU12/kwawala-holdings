import { api } from '../api/api';
import { Expense } from '../../types';

type ExpensePayload = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'Project' | 'userId' | 'addedBy'> & {
  id?: string;
  projectId: string;
  addedBy?: string;
};

export const expensesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<Expense[], void>({
      query: () => 'expenses',
      transformResponse: (response: { data: Expense[] }) => response.data,
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: 'Expense' as const, id })),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),
    getExpenseById: builder.query<Expense, string>({
      query: (id) => `expenses/${id}`,
      transformResponse: (response: { data: Expense }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Expense', id }],
    }),
    getExpensesByProject: builder.query<Expense[], string>({
      query: (projectId) => `projects/${projectId}/expenses`,
      transformResponse: (response: { data: Expense[] }) => response.data,
      providesTags: (result, _error, projectId) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: 'Expense' as const, id })),
              { type: 'Expense', id: `PROJECT-${projectId}` },
            ]
          : [{ type: 'Expense', id: `PROJECT-${projectId}` }],
    }),
    createExpense: builder.mutation<Expense, ExpensePayload>({
      query: (body) => ({
        url: 'expenses',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: Expense }) => response.data,
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    updateExpense: builder.mutation<Expense, { id: string; body: Partial<ExpensePayload> }>({
      query: ({ id, body }) => ({
        url: `expenses/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: Expense }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }],
    }),
    deleteExpense: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useGetExpensesByProjectQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;
